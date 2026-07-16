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

const IMAGE = "node:20-alpine"; // жижиг, хурдан image
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
// tar архив (Buffer) болгоно. Бүх файл app/ фолдер дор орно.
function filesToTar(files) {
  return new Promise((resolve, reject) => {
    const pack = tar.pack();
    const chunks = [];
    pack.on("data", (c) => chunks.push(c));
    pack.on("end", () => resolve(Buffer.concat(chunks)));
    pack.on("error", reject);

    // /app фолдерыг бүх хэрэглэгч уншиж чадахаар үүсгэнэ
    pack.entry({ name: "app/", type: "directory", mode: 0o755 });
    for (const f of files) {
      pack.entry(
        { name: "app/" + sanitizePath(f.path), mode: 0o644 },
        String(f.content ?? "")
      );
    }
    pack.finalize();
  });
}

// Нэг preview контейнер асаана.
// files = төслийн файлууд [{path, content}].
// (Хуучин хэлбэр: string өгвөл ганц index.html гэж үзнэ — M1-тэй нийцтэй.)
async function createPreview(files) {
  await ensureImage();

  if (typeof files === "string") {
    files = [{ path: "index.html", content: files }];
  }
  if (!Array.isArray(files) || !files.length) {
    files = [
      { path: "index.html", content: "<h1>Сайн уу, Kodu Sandbox! 🐳</h1>" },
    ];
  }

  const container = await docker.createContainer({
    Image: IMAGE,
    Cmd: ["node", "-e", SERVER_SCRIPT],
    User: "node", // 🔒 дүрэм #3: root биш хэрэглэгчээр ажиллана
    ExposedPorts: { [INTERNAL_PORT]: {} },
    HostConfig: {
      // Docker чөлөөт порт өөрөө сонгоно (HostPort хоосон)
      PortBindings: { [INTERNAL_PORT]: [{ HostPort: "" }] },
      Memory: 512 * 1024 * 1024, // 🔒 дүрэм #4: 512MB хязгаар
      NanoCpus: 1_000_000_000, //  🔒 дүрэм #4: 1 CPU хязгаар
      PidsLimit: 256, //             🔒 дүрэм #4: process тоо хязгаар
      AutoRemove: true, //           🔒 дүрэм #2: зогсмогц устана (ephemeral)
    },
    Labels: { "kodu.sandbox": "preview" }, // өөрсдийн контейнераа таних тэмдэг
  });

  // M2-ийн ГОЛ АЛХАМ: файлуудыг tar болгоод контейнерийн / дээр задална
  // (app/ prefix-тэй тул /app дотор бичигдэнэ). Асаахаас ӨМНӨ хийнэ.
  const archive = await filesToTar(files);
  await container.putArchive(archive, { path: "/" });

  await container.start();

  // Docker ямар порт сонгосныг олж авна
  const info = await container.inspect();
  const hostPort = info.NetworkSettings.Ports[INTERNAL_PORT][0].HostPort;

  // 🔒 дүрэм #2: TTL — 15 мин дараа автоматаар устгана
  const t = setTimeout(() => stopPreview(container.id).catch(() => {}), TTL_MS);
  timers.set(container.id, t);

  return { id: container.id, url: `http://localhost:${hostPort}` };
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
