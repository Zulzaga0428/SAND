// server.js — Kodu Sandbox Controller-ийн HTTP серверийн хэсэг.
// Хяналтын самбар (browser) + API-г ажиллуулна.

const express = require("express");
const path = require("path");
const { createPreview, listPreviews, stopPreview } = require("./sandbox");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Хяналтын самбар (нүүр хуудас)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Шинэ preview үүсгэх
app.post("/api/previews", async (req, res) => {
  try {
    const result = await createPreview(req.body.html);
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
  console.log(`  → http://localhost:${PORT}\n`);
});
