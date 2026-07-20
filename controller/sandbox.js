// sandbox.js — Kodu Sandbox-ийн ЦӨМ (M3 зүг)
// Docker-ыг кодоор удирдана: контейнер асаа → ТӨСЛИЙН ФАЙЛУУДЫГ дотор нь бич →
// preview URL буцаа → TTL дараа устга. Яг л E2B хийдэг ажил, гэхдээ ӨӨРИЙН код дээр.
//
// M1:   ганц HTML (env заль)
// M2:   олон файл — tar/putArchive
// M2.5: Next.js апп — node_modules бэлэн template image
// M3+:  ♨️ ДУЛААН POOL — Next.js контейнеруудыг урьдчилан асаагаад бэлэн
//       байлгана. Хэрэглэгч ирэхэд шинээр асаахгүй, бэлэн контейнерт файлаа
//       бичээд шууд өгнө (Next dev hot-reload хийнэ) → хүлээлт секундэд буурна.
//       🔒 Тусгаарлагдсан сүлжээ — контейнерууд хоорондоо ярьж чадахгүй.

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
const IMAGE_EXPO = "kodu-template-expo"; // expo горим: react-native-web (Vite) template
const INTERNAL_PORT = "3000/tcp"; // контейнер доторх вэб серверийн порт
// ⏱️ TTL (амьдрах хугацаа). Идэвхгүй байх энэ хугацааны дараа устана.
// keepalive хийвэл дахин 0-оос тоолж эхэлнэ (ашиглаж байвал амьд).
// KODU_TTL_MIN env-ээр өөрчилнө (default 15 мин). Аюулгүйн дээд хязгаар: 8 цаг.
const TTL_MS = parseFloat(process.env.KODU_TTL_MIN || "15") * 60 * 1000;
const MAX_TTL_MS = 8 * 60 * 60 * 1000; // 8 цаг — нэг preview үүнээс урт амьдрахгүй
const WARM_POOL_SIZE = parseInt(process.env.WARM_POOL_SIZE || "1", 10);
const NETWORK = "kodu-sandbox-net"; // тусгаарлагдсан сүлжээ
// Контейнерт өгөх CPU. Сервер цөөн цөмтэй бол (жишээ 1 vCPU VPS) энэ хэтрэхгүй
// байх ёстой. Хэрэгцээгээр нь тохируулна: KODU_APP_CPUS / KODU_STATIC_CPUS.
const CPUS_APP = parseFloat(process.env.KODU_APP_CPUS || "1");
const CPUS_EXPO = parseFloat(process.env.KODU_EXPO_CPUS || "1");
const CPUS_STATIC = parseFloat(process.env.KODU_STATIC_CPUS || "0.5");
// Preview URL-д хэрэглэх хаяг: локалд "localhost", VPS дээр нийтийн IP/домэйн
// (setup.sh скрипт үүнийг серверийн IP-гээр автоматаар тохируулдаг)
const PUBLIC_HOST = process.env.PUBLIC_HOST || "localhost";

// 🌐 Домэйн горим: PREVIEW_DOMAIN тохируулбал (жишээ "prw.hisainuu.online")
// preview URL нь https://<id>.<PREVIEW_DOMAIN> болно (Caddy HTTPS + subdomain
// routing). Контейнерийн порт зөвхөн 127.0.0.1-д нээгдэнэ (гаднаас шууд хүрэхгүй,
// зөвхөн Caddy → controller proxy-гоор). Тохируулаагүй бол хуучин http://IP:port.
const PREVIEW_DOMAIN = process.env.PREVIEW_DOMAIN || "";
const DOMAIN_MODE = !!PREVIEW_DOMAIN;

// containerId -> setTimeout (TTL таймер)
const timers = new Map();
// 🌐 subdomain routing: shortId(12) -> host port. Домэйн горимд proxy
// <shortid>.<PREVIEW_DOMAIN> хүсэлтийг зөв контейнер руу чиглүүлэхэд ашиглана.
const routes = new Map();
// containerId -> mode ("static"|"app"|"expo") — updateFiles зөв замд бичихэд
const previewMode = new Map();
const shortId = (id) => id.slice(0, 12);
// ♨️ Дулаан pool: урьдчилан асаасан, хэрэглэгч хүлээж буй Next.js контейнерууд
const warmPool = []; // [{ id, port }]
// Pool-оос хэрэглэгчид олгогдсон контейнерууд (label нь "warm" хэвээр тул
// жагсаалтад харуулахын тулд энд бүртгэнэ)
const claimedWarm = new Set();

// ── Сүлжээ ────────────────────────────────────────────────────────────────
// 🔒 Тусгаарлагдсан bridge сүлжээ: enable_icc=false гэдэг нь контейнерууд
// ХООРОНДОО ярьж чадахгүй гэсэн үг — нэг preview нөгөө рүү халдаж чадахгүй.
// (Гадагшаа интернэт хандалтыг бүрэн хаах ажил VPS дээр iptables-ээр хийгдэнэ.)
async function ensureNetwork() {
  try {
    await docker.getNetwork(NETWORK).inspect();
  } catch (_) {
    await docker.createNetwork({
      Name: NETWORK,
      Driver: "bridge",
      Options: { "com.docker.network.bridge.enable_icc": "false" },
    });
    console.log(`  🔒 '${NETWORK}' тусгаарлагдсан сүлжээ үүсгэлээ (icc=false)`);
  }
}

// ── Image-ууд ─────────────────────────────────────────────────────────────
async function ensureImage() {
  const images = await docker.listImages({ filters: { reference: [IMAGE] } });
  if (images.length) return;
  console.log(`  ⬇️  ${IMAGE} татаж байна... (эхний удаад л)`);
  await new Promise((resolve, reject) => {
    docker.pull(IMAGE, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (e) => (e ? reject(e) : resolve()));
    });
  });
}

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

async function ensureExpoImage() {
  const images = await docker.listImages({
    filters: { reference: [IMAGE_EXPO] },
  });
  if (!images.length) {
    throw new Error(
      `'${IMAGE_EXPO}' image алга. Эхлээд build хий: cd template-expo && docker build -t ${IMAGE_EXPO} .`
    );
  }
}

// ── Static серверийн script ───────────────────────────────────────────────
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

// ── Оролтын хязгаар ба хамгаалалт ─────────────────────────────────────────
// 🔒 API-г тусдаа үйлчилгээ болгох тул хэт том/олон файлаас хамгаална.
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

// files массивыг tar архив (Buffer) болгоно. prefix нь файл бүрийн урд
// залгагдана (static горимд "app/" — контейнерийн /app дотор орохын тулд).
function filesToTar(files, prefix = "") {
  return new Promise((resolve, reject) => {
    const pack = tar.pack();
    const chunks = [];
    pack.on("data", (c) => chunks.push(c));
    pack.on("end", () => resolve(Buffer.concat(chunks)));
    pack.on("error", reject);

    if (prefix) {
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

// ── Контейнер үүсгэх суурь тохиргоо ──────────────────────────────────────
// mode: "static" | "app" (Next.js) | "expo" (react-native-web)
function hostConfig(mode) {
  // 🔒 дүрэм #4: нөөцийн хязгаар. dev-server (Next.js/Vite) илүү RAM иддэг.
  const mem = mode === "app" ? 1024 : mode === "expo" ? 768 : 512;
  const cpus =
    mode === "app" ? CPUS_APP : mode === "expo" ? CPUS_EXPO : CPUS_STATIC;
  return {
    // Docker чөлөөт порт өөрөө сонгоно (HostPort хоосон).
    // 🔒 Домэйн горимд зөвхөн 127.0.0.1-д нээнэ — preview-д гаднаас шууд
    // (IP:порт-оор) хүрэхгүй, зөвхөн Caddy → controller proxy-гоор л хүрнэ.
    PortBindings: {
      [INTERNAL_PORT]: [{ HostIp: DOMAIN_MODE ? "127.0.0.1" : "", HostPort: "" }],
    },
    Memory: mem * 1024 * 1024,
    MemorySwap: mem * 1024 * 1024, // swap нэмэхгүй (RAM=нийт хязгаар)
    NanoCpus: Math.round(cpus * 1_000_000_000),
    PidsLimit: 256,
    AutoRemove: true, // 🔒 дүрэм #2: зогсмогц устана (ephemeral)
    NetworkMode: NETWORK, // 🔒 тусгаарлагдсан сүлжээ (контейнер хооронд icc=false)
    // 🔒 Linux capability-г БҮГДИЙГ хасна — контейнер доторх код систем
    // түвшний ямар ч тусгай эрхгүй (raw socket, mount, module ачаалах г.м бүгд хаалттай).
    CapDrop: ["ALL"],
    // 🔒 setuid/setgid-ээр эрх нэмэгдүүлэхийг хориглоно (privilege escalation хаах)
    SecurityOpt: ["no-new-privileges"],
  };
}

// Контейнерийн host дээрх портыг олж авна
async function portOf(container) {
  const info = await container.inspect();
  return info.NetworkSettings.Ports[INTERNAL_PORT][0].HostPort;
}

// Controller дотроос контейнерт хүрэх дотоод хаяг (readiness шалгах, proxy target)
const internalUrl = (port) => `http://127.0.0.1:${port}`;

// Хэрэглэгчид буцаах нийтийн хаяг:
//   домэйн горим:  https://<shortid>.<PREVIEW_DOMAIN>
//   энгийн горим:  http://<PUBLIC_HOST>:<port>
function publicUrl(id, port) {
  return DOMAIN_MODE
    ? `https://${shortId(id)}.${PREVIEW_DOMAIN}`
    : `http://${PUBLIC_HOST}:${port}`;
}

// subdomain routing туслахууд (server.js-ийн proxy ашиглана)
function resolvePort(sub) {
  return routes.get(sub);
}
// Домэйн горимд host зөв preview subdomain эсэхийг шалгана (Caddy on-demand TLS ask)
function isPreviewHost(host) {
  if (!DOMAIN_MODE || !host) return false;
  const h = host.split(":")[0].toLowerCase();
  if (h === PREVIEW_DOMAIN) return true; // суурь домэйн (dashboard/API)
  const suffix = "." + PREVIEW_DOMAIN;
  if (!h.endsWith(suffix)) return false;
  const sub = h.slice(0, -suffix.length);
  return routes.has(sub); // зөвхөн бодит preview subdomain-д гэрчилгээ олгоно
}

// ── ♨️ Дулаан pool ────────────────────────────────────────────────────────
// Next.js контейнерыг УРЬДЧИЛАН асаагаад (next dev аль хэдийн бэлэн),
// хэрэглэгч ирэхэд файлыг нь бичээд шууд өгнө. Хурдны гол нууц.

// Нэг дулаан Next.js контейнер асаана (template хуудастайгаа, бэлэн болтол хүлээнэ)
async function startWarmContainer() {
  await ensureAppImage();
  const container = await docker.createContainer({
    Image: IMAGE_APP,
    ExposedPorts: { [INTERNAL_PORT]: {} },
    HostConfig: hostConfig("app"),
    Labels: { "kodu.sandbox": "warm" },
  });
  await container.start();
  const port = await portOf(container);
  const iurl = internalUrl(port);
  await waitForReady(iurl);
  // Эхний хуудсыг нэг дуудаж compile хийлгэчихнэ — бүрэн "халсан" болно
  try {
    await fetch(iurl, { signal: AbortSignal.timeout(30_000) });
  } catch (_) {}
  return { id: container.id, port };
}

// Pool-ыг зорилтот хэмжээнд хүртэл дүүргэнэ (зэрэг нэг л ажиллана)
let warming = false;
async function warmUp() {
  if (warming) return;
  warming = true;
  try {
    while (warmPool.length < WARM_POOL_SIZE) {
      const c = await startWarmContainer();
      warmPool.push(c);
      console.log(`  ♨️  Дулаан pool: ${warmPool.length}/${WARM_POOL_SIZE} бэлэн`);
    }
  } catch (e) {
    console.error("  ♨️  pool дүүргэх алдаа:", e.message);
  } finally {
    warming = false;
  }
}

// ── Эхлүүлэх цэвэрлэгээ ──────────────────────────────────────────────────
// Controller унтарч асахад өмнөх ажиллагааны контейнерууд (pool болон TTL
// таймераа алдсан preview-ууд) хоцордог. Асахдаа бүгдийг цэвэрлээд шинээр эхэлнэ.
async function init() {
  await ensureNetwork();
  const stale = await docker.listContainers({
    all: true,
    filters: { label: ["kodu.sandbox"] },
  });
  for (const c of stale) {
    try {
      await docker.getContainer(c.Id).remove({ force: true });
    } catch (_) {}
  }
  if (stale.length) {
    console.log(`  🧹 Өмнөх ажиллагааны ${stale.length} контейнер цэвэрлэлээ`);
  }
  routes.clear();
  previewMode.clear();
  warmPool.length = 0;
  claimedWarm.clear();
  warmUp(); // pool-ыг ард нь дүүргэж эхэлнэ (хүлээхгүй)
}

// ── ⏱️ TTL удирдлага ──────────────────────────────────────────────────────
// Preview-д "устах цаг" тавина. keepalive хийвэл цагийг 0-оос дахин тоолно.
// ttlMs өгвөл түүнийг (MAX_TTL_MS-ээс хэтрэхгүйгээр) ашиглана, үгүй бол default.
function scheduleTTL(id, ttlMs) {
  const ms = Math.min(ttlMs || TTL_MS, MAX_TTL_MS);
  const old = timers.get(id);
  if (old) clearTimeout(old);
  const t = setTimeout(() => stopPreview(id).catch(() => {}), ms);
  if (t.unref) t.unref(); // таймер процессыг амьд байлгахгүй
  timers.set(id, t);
}

// keepalive: preview-ийн устах цагийг хойшлуулна (ашиглаж байгаа тул амьд байлга).
// Тухайн preview байхгүй бол false буцаана.
async function keepAlive(id, ttlMs) {
  const containers = await docker.listContainers({
    filters: { label: ["kodu.sandbox"] },
  });
  const found = containers.find((c) => c.Id === id || c.Id.startsWith(id));
  if (!found) return false;
  scheduleTTL(found.Id, ttlMs);
  return true;
}

// ── Preview үүсгэх ────────────────────────────────────────────────────────
// files = төслийн файлууд [{path, content}] (string бол ганц index.html).
// mode  = "static" (HTML/CSS/JS) | "app" (Next.js) | "expo" (react-native-web)
async function createPreview(files, mode = "static", ttlMs) {
  const isApp = mode === "app";
  const isExpo = mode === "expo";
  const isServer = isApp || isExpo; // dev-server суурьтай (Next.js / Vite)

  if (typeof files === "string") {
    files = [{ path: "index.html", content: files }];
  }
  if (!Array.isArray(files) || !files.length) {
    files = isServer
      ? []
      : [{ path: "index.html", content: "<h1>Сайн уу, Kodu Sandbox! 🐳</h1>" }];
  }
  validateFiles(files);

  // ♨️ App горим + pool-д бэлэн контейнер байвал — ХУРДАН зам:
  // бэлэн контейнерт файлаа бичихэд next dev hot-reload хийгээд шууд бэлэн.
  if (isApp && warmPool.length) {
    const c = warmPool.shift();
    warmUp(); // pool-ыг ард нь нөхөж эхэлнэ (хүлээхгүй)
    try {
      if (files.length) {
        const archive = await filesToTar(files, "");
        await docker.getContainer(c.id).putArchive(archive, {
          path: "/home/node/app",
        });
      }
      // Нэг дуудаж шинэ хуудсыг compile хийлгэнэ (хүсэлт compile дуустал хүлээдэг)
      try {
        await fetch(internalUrl(c.port), { signal: AbortSignal.timeout(60_000) });
      } catch (_) {}
      claimedWarm.add(c.id);
      routes.set(shortId(c.id), c.port); // subdomain routing бүртгэл
      previewMode.set(c.id, "app");
      scheduleTTL(c.id, ttlMs);
      return { id: c.id, url: publicUrl(c.id, c.port), warm: true };
    } catch (e) {
      await stopPreview(c.id).catch(() => {});
      throw e;
    }
  }

  // Удаан зам: шинээр асаана (pool хоосон / static / expo)
  const image = isApp ? IMAGE_APP : isExpo ? IMAGE_EXPO : IMAGE;
  if (isApp) await ensureAppImage();
  else if (isExpo) await ensureExpoImage();
  else await ensureImage();

  const container = await docker.createContainer({
    Image: image,
    // Server горимд (Next.js/Expo) template image-ийн CMD (dev server) өөрөө
    // ажиллана. Static горимд л жижиг node серверийг гараар өгнө.
    ...(isServer ? {} : { Cmd: ["node", "-e", SERVER_SCRIPT], User: "node" }),
    ExposedPorts: { [INTERNAL_PORT]: {} },
    HostConfig: hostConfig(mode),
    Labels: { "kodu.sandbox": "preview" },
  });

  // Файлуудыг tar болгоод контейнер руу бичнэ. Асаахаас ӨМНӨ хийнэ.
  // server горим: /home/node/app дотор (template-ийн файлыг дарна)
  // static:       /app дотор
  if (files.length) {
    if (isServer) {
      const archive = await filesToTar(files, "");
      await container.putArchive(archive, { path: "/home/node/app" });
    } else {
      const archive = await filesToTar(files, "app/");
      await container.putArchive(archive, { path: "/" });
    }
  }

  await container.start();
  const port = await portOf(container);
  routes.set(shortId(container.id), port); // subdomain routing бүртгэл
  previewMode.set(container.id, mode);

  // 🔒 дүрэм #2: TTL — идэвхгүй байвал устгана (keepalive-аар сунгаж болно)
  scheduleTTL(container.id, ttlMs);

  // Dev server (Next.js/Expo) асч дуустал хүлээнэ (static бол шууд бэлэн)
  if (isServer) {
    try {
      await waitForReady(internalUrl(port));
    } catch (e) {
      await stopPreview(container.id);
      throw e;
    }
  }

  return { id: container.id, url: publicUrl(container.id, port), warm: false };
}

// ── Ажиллаж буй preview-ийн файлыг шинэчлэх (hot reload) ─────────────────────
// Шинээр контейнер асаахгүйгээр байгаа preview-ийн файлуудыг дарж бичнэ.
// Next.js/Vite dev server өөрчлөлтийг мэдэрч HMR/reload хийнэ.
async function updateFiles(id, files) {
  const containers = await docker.listContainers({
    filters: { label: ["kodu.sandbox"] },
  });
  const found = containers.find((c) => c.Id === id || c.Id.startsWith(id));
  if (!found) return false;
  if (!Array.isArray(files) || !files.length) return true;
  validateFiles(files);
  const mode = previewMode.get(found.Id) || "app";
  const isServer = mode === "app" || mode === "expo";
  const archive = await filesToTar(files, isServer ? "" : "app/");
  await docker
    .getContainer(found.Id)
    .putArchive(archive, { path: isServer ? "/home/node/app" : "/" });
  scheduleTTL(found.Id); // засвар хийсэн тул амьд байлгана
  return true;
}

// Ажиллаж буй бүх preview-г жагсаана
// (label=preview бүгд + pool-оос олгогдсон "warm" контейнерууд)
async function listPreviews() {
  const containers = await docker.listContainers({
    filters: { label: ["kodu.sandbox"] },
  });
  return containers
    .filter((c) => {
      const kind = c.Labels["kodu.sandbox"];
      return kind === "preview" || (kind === "warm" && claimedWarm.has(c.Id));
    })
    .map((c) => {
      const p = (c.Ports || []).find((x) => x.PublicPort);
      return {
        id: c.Id,
        url: p ? publicUrl(c.Id, p.PublicPort) : null,
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
  claimedWarm.delete(id);
  routes.delete(shortId(id)); // subdomain routing бүртгэлээс хасна
  previewMode.delete(id);
  const container = docker.getContainer(id);
  // AutoRemove идэвхтэй тул stop хийхэд өөрөө устана.
  try {
    await container.stop({ t: 2 });
  } catch (_) {}
  try {
    await container.remove({ force: true });
  } catch (_) {}
}

module.exports = {
  init,
  createPreview,
  updateFiles,
  listPreviews,
  stopPreview,
  keepAlive,
  // subdomain routing (server.js proxy ашиглана)
  resolvePort,
  isPreviewHost,
  PREVIEW_DOMAIN,
  DOMAIN_MODE,
};
