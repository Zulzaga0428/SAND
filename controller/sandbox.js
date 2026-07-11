// sandbox.js — Kodu Sandbox-ийн ЦӨМ
// Docker-ыг кодоор удирдана: контейнер асаа → preview URL буцаа → TTL дараа устга.
// Яг л E2B хийдэг ажил, гэхдээ ӨӨРИЙН код дээр.

const Docker = require("dockerode");

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

// Нэг preview контейнер асаана.
// html = хэрэглэгчийн үзүүлэх вэб хуудасны агуулга.
async function createPreview(html) {
  await ensureImage();

  const safeHtml =
    html && html.trim() ? html : "<h1>Сайн уу, Kodu Sandbox! 🐳</h1>";

  // Контейнер дотор ажиллах жижиг вэб сервер.
  // Өгсөн HTML-ийг орчны хувьсагчаар дамжуулж, порт 3000 дээр үзүүлнэ.
  const script =
    'const http=require("http");' +
    "http.createServer((q,r)=>{" +
    'r.setHeader("Content-Type","text/html; charset=utf-8");' +
    "r.end(process.env.KODU_HTML);" +
    '}).listen(3000,()=>console.log("preview up"));';

  const container = await docker.createContainer({
    Image: IMAGE,
    Cmd: ["node", "-e", script],
    Env: [`KODU_HTML=${safeHtml}`],
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
