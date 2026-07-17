// server.js — Kodu Sandbox landing сайтын жижиг сервер.
// Зөвхөн static хуудас үзүүлнэ — Docker, DB юу ч хэрэггүй.
// Railway дээр root directory = landing гэж тохируулаад deploy хийнэ.

const express = require("express");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

// Railway-гийн health check
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🐳 Kodu Sandbox landing → http://localhost:${PORT}`);
});
