// server.js — Kodu Sandbox Controller-ийн HTTP серверийн хэсэг.
// 3 үүрэг:
//   1) Хяналтын самбар (browser UI) + API — суурь домэйн / localhost дээр
//   2) Preview subdomain routing — <id>.<PREVIEW_DOMAIN> → зөв контейнер (proxy)
//   3) Caddy on-demand TLS "ask" endpoint
//
// API нь ТҮЛХҮҮРЭЭР хамгаалагдсан (architecture.md): зөвхөн түлхүүр мэддэг
// client (жишээ нь KoDu) л дуудна.

const http = require("http");
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const httpProxy = require("http-proxy");
const {
  init,
  createPreview,
  updateFiles,
  listPreviews,
  stopPreview,
  keepAlive,
  resolvePort,
  isPreviewHost,
  PREVIEW_DOMAIN,
  DOMAIN_MODE,
} = require("./sandbox");

// POST body-гийн ttl (минут) → миллисекунд. Буруу/хоосон бол undefined.
function ttlFromBody(body) {
  const min = parseFloat(body && body.ttlMin);
  return Number.isFinite(min) && min > 0 ? min * 60 * 1000 : undefined;
}

// ── API түлхүүр ──────────────────────────────────────────────────────────
const KEY_FILE = path.join(__dirname, ".kodu-key");

function loadApiKey() {
  if (process.env.KODU_SANDBOX_KEY) return process.env.KODU_SANDBOX_KEY.trim();
  try {
    const k = fs.readFileSync(KEY_FILE, "utf8").trim();
    if (k) return k;
  } catch (_) {}
  const key = "kodu_" + crypto.randomBytes(24).toString("hex");
  fs.writeFileSync(KEY_FILE, key + "\n", "utf8");
  return key;
}

const API_KEY = loadApiKey();

function keysEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// ── Preview subdomain proxy ────────────────────────────────────────────────
// <id>.<PREVIEW_DOMAIN> хүсэлтийг зөв контейнер руу дамжуулна.
// changeOrigin: контейнерт Host-ыг 127.0.0.1 болгож дамжуулна — Vite/Next dev
// серверийн Host-шалгалт (allowedHosts) саад болохгүй.
const proxy = httpProxy.createProxyServer({ xfwd: true, ws: true, changeOrigin: true });
proxy.on("error", (err, req, res) => {
  console.error("proxy алдаа:", err.code || "", err.message, "→", req && req.headers && req.headers.host);
  try {
    if (res.writeHead) {
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Preview бэлэн биш эсвэл дууссан байна.");
    } else if (res.destroy) {
      res.destroy(); // socket (ws)
    }
  } catch (_) {}
});

// Хүсэлтийн Host-оос preview target олно.
// null → суурь домэйн/localhost (dashboard/API). "notfound" → буруу subdomain.
function previewTarget(req) {
  if (!DOMAIN_MODE) return null;
  const host = (req.headers.host || "").split(":")[0].toLowerCase();
  if (host === PREVIEW_DOMAIN) return null; // суурь домэйн → dashboard/API
  const suffix = "." + PREVIEW_DOMAIN;
  if (!host.endsWith(suffix)) return null; // localhost г.м → dashboard/API
  const sub = host.slice(0, -suffix.length);
  const port = resolvePort(sub);
  return port ? `http://127.0.0.1:${port}` : "notfound";
}

const app = express();
app.set("trust proxy", 1);

// ⚠️ Proxy нь body-parser-аас ӨМНӨ ажиллана — preview рүү явах хүсэлтийн
// биеийг controller уншиж авахгүй (POST/upload шууд preview-д хүрнэ).
app.use((req, res, next) => {
  const target = previewTarget(req);
  if (target === null) return next(); // dashboard/API
  if (target === "notfound") {
    res.status(404).send("Preview олдсонгүй эсвэл дууссан байна.");
    return;
  }
  // agent:false — холболт бүрийг шинээр (keep-alive quirk-ээс сэргийлнэ)
  proxy.web(req, res, { target, agent: false });
});

app.use(express.json({ limit: "5mb" }));

// Caddy on-demand TLS ask: зөвхөн бодит preview subdomain / суурь домэйнд
// гэрчилгээ олгоно (санамсаргүй subdomain-аар гэрчилгээ асуухаас сэргийлнэ).
app.get("/__caddy_ask", (req, res) => {
  const domain = String(req.query.domain || "");
  return isPreviewHost(domain) ? res.status(200).send("ok") : res.status(403).send("no");
});

// ── 📱 Хурд хэмжих endpoint ─────────────────────────────────────────────────
// Токио сервер → хэрэглэгчийн (утас) хооронд татах хурдыг хэмжинэ.
// E2B-ийн ~250KB/s-тэй харьцуулах native замын шийдвэрт хэрэгтэй.
// Утаснаас нээ:  https://<домэйн>/__speedtest?mb=20   (эсвэл http://IP:4000/...)
// Түлхүүр шаардахгүй. Дээд хэмжээ 100MB.
app.get("/__speedtest", (req, res) => {
  const mb = Math.min(Math.max(parseInt(req.query.mb, 10) || 10, 1), 100);
  const total = mb * 1024 * 1024;
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", String(total));
  res.setHeader("Content-Disposition", `attachment; filename="speedtest-${mb}mb.bin"`);
  res.setHeader("Cache-Control", "no-store");
  const chunk = Buffer.alloc(256 * 1024); // 256KB (path-д шахалт байхгүй тул түүхий хурд)
  let sent = 0;
  (function pump() {
    while (sent < total) {
      const buf = total - sent < chunk.length ? chunk.subarray(0, total - sent) : chunk;
      sent += buf.length;
      if (!res.write(buf)) return res.once("drain", pump);
    }
    res.end();
  })();
});

// ── Rate limit ─────────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = parseInt(process.env.RATE_MAX || "30", 10);
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (arr.length > RATE_MAX) {
    return res.status(429).json({ error: "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу." });
  }
  next();
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of hits) {
    const keep = arr.filter((t) => now - t < RATE_WINDOW_MS);
    if (keep.length) hits.set(ip, keep);
    else hits.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

// ── Dashboard + API (суурь домэйн / localhost) ──────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/api", rateLimit);
app.use("/api", (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (keysEqual(token, API_KEY)) return next();
  res.status(401).json({
    error: "API түлхүүр буруу эсвэл алга. Authorization: Bearer <түлхүүр> илгээнэ үү.",
  });
});

app.post("/api/previews", async (req, res) => {
  try {
    const result = await createPreview(
      req.body.files || req.body.html,
      req.body.mode || "static",
      ttlFromBody(req.body)
    );
    res.json(result);
  } catch (e) {
    console.error("createPreview алдаа:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/previews/:id/keepalive", async (req, res) => {
  try {
    const ok = await keepAlive(req.params.id, ttlFromBody(req.body));
    if (!ok) return res.status(404).json({ error: "Preview олдсонгүй" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ажиллаж буй preview-ийн файлыг шинэчлэх (hot reload — шинэ контейнер асаахгүй).
// Засварласан кодыг { files: [...] }-ээр илгээнэ → HMR/reload хийнэ.
app.put("/api/previews/:id/files", async (req, res) => {
  try {
    const ok = await updateFiles(req.params.id, req.body.files);
    if (!ok) return res.status(404).json({ error: "Preview олдсонгүй" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/previews", async (req, res) => {
  try {
    res.json(await listPreviews());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/previews/:id", async (req, res) => {
  try {
    await stopPreview(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Сервер (websocket upgrade-ийг гараар барина — Next.js HMR) ───────────────
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  const target = previewTarget(req);
  if (target && target !== "notfound") {
    proxy.ws(req, socket, head, { target });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log("\n  🐳 Kodu Sandbox Controller аслаа");
  console.log(`  → http://localhost:${PORT}`);
  if (DOMAIN_MODE) console.log(`  🌐 Preview домэйн: *.${PREVIEW_DOMAIN}`);
  console.log(`  🔑 API түлхүүр: ${API_KEY}`);
  console.log("     (самбар нээхэд энэ түлхүүрийг асуувал үүнийг хуулж өгнө)\n");
  init().catch((e) => console.error("init алдаа:", e.message));
});
