// sandbox.js — Kodu Sandbox-ийн ЦӨМ (M2)
// Docker-ыг кодоор удирдана: контейнер асаа → ТӨСЛИЙН ФАЙЛУУДЫГ дотор нь бич →
// preview URL буцаа → TTL дараа устга. Яг л E2B хийдэг ажил, гэхдээ ӨӨРИЙН код дээр.
//
// M1: ганц HTML-ийг env хувьсагчаар дамжуулдаг байсан (жижиг заль).
// M2: ОЛОН ФАЙЛЫГ tar архив болгож контейнер руу шууд бичнэ (putArchive) —
//     энэ бол жинхэнэ sandbox-уудын ашигладаг арга.

const Docker = require("dockerode");
const tar = require("tar-stream");

// Docker Desktop-той холбогдоно.
// Windows дээр named pipe, Mac/Linux дээр socket ашиглана.
const docker =
  process.platform === "win32"
    ? new Docker({ socketPath: "//./pipe/docker_engine" })
    : new Docker({ socketPath: "/var/run/docker.sock" });

const IMAGE = "node:20-alpine"; // static горим: жижиг, хурдан image
const IMAGE_APP = "kodu-template-next"; // app горим: node_modules бэлэн Next.js template
const INTERNAL_PORT = "3000/tcp"; // контейнер доторх вэб серверийн порт
const TTL_MS = 15 * 60 * 1000; // 15 мин дараа автоматаар устна

// containerId -> setTimeout (TTL таймер)
const timers = new Map();

// Image байхгүй бол татаж авна (эхний удаад л)
async function ensureImage() {
  const images = await docker.listImages({
    filters: { reference: [IMAGE] },
  });
  if (images.length) return;
  console.log(`  ⬇️  ${IMAGE} татаж байна... (эхний удаад л)`);
  await new Promise((resolve, reject) => {
    docker.pull(IMAGE, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (e) => (e ? reject(e) : resolve()));
    });
  });
}

// Контейнер дотор ажиллах жижиг static сервер.
// /app доторх файлуудыг зөв Content-Type-тэйгээр үзүүлнэ.
const SERVER_SCRIPT =
  'const http=require("http"),fs=require("fs"),path=require("path");' +
  'const root="/app";' +
  "const mime={" +
  '".html":"text/html",".css":"text/css",".js":"text/javascript",' +
  '".json":"application/json",".svg":"image/svg+xml",".txt":"text/plain"' +
  "};" +
  "http.createServer((req,res)=>{" +
  'let p=decodeURIComponent(req.url.split("?")[0]);' +
  'if(p.endsWith("/"))p+="index.html";' +
  "const f=path.normalize(path.join(root,p));" +
  "if(!f.startsWith(root)){res.statusCode=403;return res.end('forbidden');}" +
  "fs.readFile(f,(e,d)=>{" +
  "if(e){res.statusCode=404;return res.end('not found');}" +
  "const ext=path.extname(f).toLowerCase();" +
  'res.setHeader("Content-Type",(mime[ext]||"application/octet-stream")+' +
  '(mime[ext]?"; charset=utf-8":""));' +
  "res.end(d);});" +
  '}).listen(3000,()=>console.log("preview up"));';

// 🔒 Оролтын хязгаарууд — API-г тусдаа үйлчилгээ болгох тул
// хэт том/олон файлаар серверийг дарахаас хамгаална.
const MAX_FILES = 50;
const MAX_FILE_BYTES = 512 * 1024; // файл бүр ≤ 512KB
const MAX_TOTAL_BYTES = 2 * 1024 * 1024; // нийт ≤ 2MB

function validateFiles(files) {
  if (files.length > MAX_FILES) {
    throw new Error(`Хэт олон файл: ${files.length} (дээд тал нь ${MAX_FILES})`);
  }
  let total = 0;
  for (const f of files) {
    const size = Buffer.byteLength(String(f.content ?? ""));
    if (size > MAX_FILE_BYTES) {
      throw new Error(`'${f.path}' хэт том (${size} байт, дээд тал нь ${MAX_FILE_BYTES})`);
    }
    total += size;
  }
  if (total > MAX_TOTAL_BYTES) {
    throw new Error(`Нийт хэмжээ хэт том (${total} байт, дээд тал нь ${MAX_TOTAL_BYTES})`);
  }
}

// Хэрэглэгчийн өгсөн файлын замыг цэвэрлэнэ (аюулгүй байдал):
// эхний "/"-үүдийг хасна, ".."-тэй замыг хориглоно.
function sanitizePath(p) {
  const clean = String(p || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!clean || clean.split("/").includes("..")) {
    throw new Error(`Буруу файлын зам: ${p}`);
  }
  return clean;
}

// files = [{ path: "index.html", content: "..." }, ...] массивыг
// tar архив (Buffer) болгоно. prefix нь файл бүрийн урд залгагдана
// (static горимд "app/" — контейнерийн /app дотор орохын тулд).
function filesToTar(files, prefix = "") {
  return new Promise((resolve, reject) => {
    const pack = tar.pack();
    const chunks = [];
    pack.on("data", (c) => chunks.push(c));
    pack.on("end", () => resolve(Buffer.concat(chunks)));
    pack.on("error", reject);

    if (prefix) {
      // prefix фолдерыг бүх хэрэглэгч уншиж чадахаар үүсгэнэ
      pack.entry({ name: prefix, type: "directory", mode: 0o755 });
    }
    for (const f of files) {
      pack.entry(
        { name: prefix + sanitizePath(f.path), mode: 0o644 },
        String(f.content ?? "")
      );
    }
    pack.finalize();
  });
}

// Next.js template image бэлэн эсэхийг шалгана (build хийгдсэн байх ёстой)
async function ensureAppImage() {
  const images = await docker.listImages({
    filters: { reference: [IMAGE_APP] },
  });
  if (!images.length) {
    throw new Error(
      `'${IMAGE_APP}' image алга. Эхлээд build хий: cd template && docker build -t ${IMAGE_APP} .`
    );
  }
}

// Preview URL хариу өгч эхэлтэл хүлээнэ (Next.js асахад хэдэн секунд авдаг)
async function waitForReady(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok || res.status < 500) return;
    } catch (_) {
      // хараахан бэлэн болоогүй — дахин оролдоно
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Preview хугацаандаа бэлэн болсонгүй (90 сек)");
}

// Нэг preview контейнер асаана.
// files = төслийн файлууд [{path, content}].
// mode  = "static" (M2: HTML/CSS/JS) эсвэл "app" (M2.5: Next.js).
// (Хуучин хэлбэр: string өгвөл ганц index.html гэж үзнэ — M1-тэй нийцтэй.)
async function createPreview(files, mode = "static") {
  const isApp = mode === "app";

  if (isApp) {
    await ensureAppImage();
  } else {
    await ensureImage();
  }

  if (typeof files === "string") {
    files = [{ path: "index.html", content: files }];
  }
  if (!Array.isArray(files) || !files.length) {
    files = isApp
      ? []
      : [{ path: "index.html", content: "<h1>Сайн уу, Kodu Sandbox! 🐳</h1>" }];
  }
  validateFiles(files);

  const container = await docker.createContainer({
    Image: isApp ? IMAGE_APP : IMAGE,
    // app горимд template image-ийн CMD (npm run dev) өөрөө ажиллана
    ...(isApp ? {} : { Cmd: ["node", "-e", SERVER_SCRIPT], User: "node" }),
    ExposedPorts: { [INTERNAL_PORT]: {} },
    HostConfig: {
      // Docker чөлөөт порт өөрөө сонгоно (HostPort хоосон)
      PortBindings: { [INTERNAL_PORT]: [{ HostPort: "" }] },
      // 🔒 дүрэм #4: нөөцийн хязгаар. Next.js dev server илүү их RAM иддэг
      // тул app горимд 1GB / 2 CPU өгнө.
      Memory: (isApp ? 1024 : 512) * 1024 * 1024,
      NanoCpus: (isApp ? 2 : 1) * 1_000_000_000,
      PidsLimit: 256,
      AutoRemove: true, // 🔒 дүрэм #2: зогсмогц устана (ephemeral)
    },
    Labels: { "kodu.sandbox": "preview" }, // өөрсдийн контейнераа таних тэмдэг
  });

  // ГОЛ АЛХАМ: файлуудыг tar болгоод контейнер руу бичнэ. Асаахаас ӨМНӨ хийнэ.
  // static: /app дотор (static серверийн root)
  // app:    /home/node/app дотор (Next.js төслийн root) — хэрэглэгчийн файлууд
  //         template-ийн app/page.js зэргийг ДАРЖ бичнэ.
  if (files.length) {
    if (isApp) {
      const archive = await filesToTar(files, "");
      await container.putArchive(archive, { path: "/home/node/app" });
    } else {
      const archive = await filesToTar(files, "app/");
      await container.putArchive(archive, { path: "/" });
    }
  }

  await container.start();

  // Docker ямар порт сонгосныг олж авна
  const info = await container.inspect();
  const hostPort = info.NetworkSettings.Ports[INTERNAL_PORT][0].HostPort;
  const url = `http://localhost:${hostPort}`;

  // 🔒 дүрэм #2: TTL — 15 мин дараа автоматаар устгана
  const t = setTimeout(() => stopPreview(container.id).catch(() => {}), TTL_MS);
  timers.set(container.id, t);

  // Next.js асч дуустал хүлээнэ (static бол шууд бэлэн)
  if (isApp) {
    try {
      await waitForReady(url);
    } catch (e) {
      await stopPreview(container.id);
      throw e;
    }
  }

  return { id: container.id, url };
}

// Ажиллаж буй бүх preview-г жагсаана
async function listPreviews() {
  const containers = await docker.listContainers({
    filters: { label: ["kodu.sandbox=preview"] },
  });
  return containers.map((c) => {
    const p = (c.Ports || []).find((x) => x.PublicPort);
    return {
      id: c.Id,
      url: p ? `http://localhost:${p.PublicPort}` : null,
      state: c.State,
    };
  });
}

// Нэг preview-г зогсоож устгана
async function stopPreview(id) {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
  const container = docker.getContainer(id);
  // AutoRemove идэвхтэй тул stop хийхэд өөрөө устана.
  try {
    await container.stop({ t: 2 });
  } catch (_) {}
  try {
    await container.remove({ force: true });
  } catch (_) {}
}

module.exports = { createPreview, listPreviews, stopPreview };
