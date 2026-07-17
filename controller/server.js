// server.js — Kodu Sandbox Controller-ийн HTTP серверийн хэсэг.
// Хяналтын самбар (browser) + API-г ажиллуулна.
//
// API нь ТҮЛХҮҮРЭЭР хамгаалагдсан (architecture.md): Kodu Sandbox бол тусдаа
// үйлчилгээ тул зөвхөн түлхүүр мэддэг client (жишээ нь KoDu) л дуудаж чадна.

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { init, createPreview, listPreviews, stopPreview } = require("./sandbox");

// ── API түлхүүр ──────────────────────────────────────────────────────────
// Дараалал: 1) KODU_SANDBOX_KEY орчны хувьсагч, 2) .kodu-key файл,
// 3) аль нь ч байхгүй бол шинээр үүсгэж .kodu-key-д хадгална.
// .kodu-key нь .gitignore-д орсон — түлхүүр GitHub руу ХЭЗЭЭ Ч гарахгүй.
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

// Хугацааны халдлагаас хамгаалсан харьцуулалт
function keysEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

const app = express();
app.set("trust proxy", 1); // reverse proxy (Caddy) ард байвал жинхэнэ IP-г уншина
app.use(express.json({ limit: "5mb" }));

// 🔒 Энгийн rate limit — IP тус бүр цонхонд N хүсэлт. Санах ойд, гуравдагч
// сан хэрэггүй. Хортой хэн нэг олон хүсэлтээр серверийг дарахаас хамгаална.
const RATE_WINDOW_MS = 60_000; // 1 минут
const RATE_MAX = parseInt(process.env.RATE_MAX || "30", 10); // IP-д минутад 30 хүсэлт
const hits = new Map(); // ip -> [timestamps]
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
// Санах ой хуримтлагдахаас сэргийлж хуучин бүртгэлийг цэвэрлэнэ
setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of hits) {
    const keep = arr.filter((t) => now - t < RATE_WINDOW_MS);
    if (keep.length) hits.set(ip, keep);
    else hits.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

// Хяналтын самбар (нүүр хуудас) — түлхүүр шаардахгүй, харин API нь шаардана
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔒 /api/* бүх зам эхлээд rate limit, дараа нь түлхүүр шаардана
app.use("/api", rateLimit);
app.use("/api", (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (keysEqual(token, API_KEY)) return next();
  res.status(401).json({
    error: "API түлхүүр буруу эсвэл алга. Authorization: Bearer <түлхүүр> илгээнэ үү.",
  });
});

// Шинэ preview үүсгэх.
// M2:   { files: [{path, content}, ...] } — static сайт
// M2.5: { files: [...], mode: "app" } — Next.js апп (template image хэрэгтэй)
// M1-тэй нийцтэй: { html: "..." } өгвөл ганц index.html гэж үзнэ.
app.post("/api/previews", async (req, res) => {
  try {
    const result = await createPreview(
      req.body.files || req.body.html,
      req.body.mode || "static"
    );
    res.json(result);
  } catch (e) {
    console.error("createPreview алдаа:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Ажиллаж буй preview-уудыг жагсаах
app.get("/api/previews", async (req, res) => {
  try {
    res.json(await listPreviews());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Preview зогсоох/устгах
app.delete("/api/previews/:id", async (req, res) => {
  try {
    await stopPreview(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("\n  🐳 Kodu Sandbox Controller аслаа");
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  🔑 API түлхүүр: ${API_KEY}`);
  console.log("     (самбар нээхэд энэ түлхүүрийг асуувал үүнийг хуулж өгнө)\n");
  // Цэвэрлэгээ + сүлжээ + дулаан pool-ыг ард нь эхлүүлнэ
  init().catch((e) => console.error("init алдаа:", e.message));
});
