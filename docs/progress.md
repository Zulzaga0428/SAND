# 📈 Явцын тэмдэглэл (Progress Log)

> Хаана байгаа, дараа юунаас үргэлжлүүлэхээ энд тэмдэглэнэ.

---

## ✅ Өдөр 1 — Docker + M1 Preview engine (2026 оны 7-р сар)

**Нэг өдөрт тэг мэдлэгээс эхэлж дараах бүгдийг хийсэн:**

- ✅ Docker Desktop суулгаж, тохируулсан (WSL update, PowerShell execution policy)
- ✅ Контейнер асааж, дотор нь орж, файл үүсгэсэн (`docker run -it ubuntu bash`)
- ✅ image / container / порт / ephemeral ойлголтуудыг эзэмшсэн
- ✅ nginx-ээр гараар preview үзсэн (`docker run -d -p 8080:80 nginx`)
- ✅ **M1: `controller/` бичиж, кодоор контейнер асааж preview үзсэн** 🎉
  - Node + dockerode controller (`sandbox.js`, `server.js`, `public/index.html`)
  - Товч дархад → контейнер асаана → санамсаргүй порт нээнэ → preview URL
  - Аюулгүй дүрмүүд: non-root, 512MB/1CPU/256 pids, 15 мин TTL
  - **Ажиллаж баталсан:** `localhost:52399` дээр "Миний сайт" гарсан ✅

**Дадлагаар мэдсэн зүйл:**
- `docker pull node:20-alpine` — image-ыг гараар урьдчилж татаж авах нь найдвартай
- `npm run dev` ажиллуулахын өмнө **зөв фолдер (`controller/`) дотор** байх ёстой
- Controller асаахын өмнө Docker Desktop **"Engine running" (ногоон)** байх ёстой

---

## ⬜ Дараа юунаас үргэлжлүүлэх вэ — M2

**Зорилго:** Нэг HTML биш, **бүтэн олон файлтай төсөл** (жишээ нь Next.js) контейнер
дотор ажиллуулж preview үзэх.

Санаанууд:
- Хэрэглэгчээс зөвхөн HTML биш, **олон файл** авах (жижиг төсөл)
- Контейнер дотор файлуудыг бичиж → `npm install && npm run dev` ажиллуулах
- Next.js эсвэл Vite төслийг контейнер дотор асааж preview харуулах
- Хэд хэдэн preview зэрэг ажиллуулж туршиж үзэх

---

## 🔁 Дараагийн session-д хэрхэн эргэж эхлэх вэ

1. Docker Desktop нээ → "Engine running" ногоон болтол хүлээ
2. PowerShell → `controller/` фолдер руу `cd` хий
3. `npm run dev` → `localhost:4000` нээ
4. Ажиллаж байгааг батал (Preview үүсгэ)
5. Дараа нь M2 руу үргэлжил

> Зарчим хэвээрээ: **өдөр бүр 1%. Бид яарахгүй.** 🐢
