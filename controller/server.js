// server.js — Kodu Sandbox Controller-ийн HTTP серверийн хэсэг.
// Хяналтын самбар (browser) + API-г ажиллуулна.
//
// API нь ТҮЛХҮҮРЭЭР хамгаалагдсан (architecture.md): Kodu Sandbox бол тусдаа
// үйлчилгээ тул зөвхөн түлхүүр мэддэг client (жишээ нь KoDu) л дуудаж чадна.

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { createPreview, listPreviews, stopPreview } = require("./sandbox");

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
app.use(express.json({ limit: "5mb" }));

// Хяналтын самбар (нүүр хуудас) — түлхүүр шаардахгүй, харин API нь шаардана
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔒 /api/* бүх зам түлхүүр шаардана: Authorization: Bearer <түлхүүр>
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
});
