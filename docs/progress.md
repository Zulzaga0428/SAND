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

## ✅ Өдөр 2 — M2: Олон файлтай төсөл (2026-07-17)

**Юу хийсэн:**

- ✅ **M2: controller одоо олон файлтай төсөл дэмждэг боллоо** 🎉
  - Файлуудыг **tar архив** болгож `putArchive`-аар контейнер руу бичдэг —
    E2B зэрэг жинхэнэ sandbox-уудын ашигладаг арга (env-хувьсагчийн заль байхгүй)
  - Контейнер доторх static сервер файл бүрийг зөв Content-Type-тэй үзүүлнэ
  - UI: файлын tab-тай editor (файл нэмэх ➕ / устгах ✕)
  - Аюулгүй байдал: файлын зам шалгадаг (`..` хориглоно)
- ✅ **Бүрэн туршиж баталсан** (Claude чиний компьютер дээр шууд ажиллаж):
  - 3 файл (HTML+CSS+JS) → контейнер аслаа → бүгд зөв Content-Type-тэй гарсан
  - 404 зөв, DELETE хийхэд контейнер бүрэн устсан
- ✅ Ажлын хувилбар: `C:\Users\Administrator\SAND` (жинхэнэ git clone).
  Хуучин `Pictures\SAND-main` ZIP хувилбарыг ашиглахаа больсон.

---

## ✅ Өдөр 2 (үргэлжлэл) — M2.5: Next.js контейнер дотор (2026-07-17)

**Юу хийсэн:**

- ✅ **Архитектурын шийдвэр** ([architecture.md](architecture.md)): Kodu Sandbox
  бол KoDu-гийн дотоод хэсэг БИШ — **тусдаа сайт/үйлчилгээ + API.**
  KoDu хожим зөвхөн API-аар холбогдоно (яг E2B шиг).
- ✅ **M2.5: жинхэнэ Next.js апп контейнер дотор ажилладаг боллоо** ⚛️
  - `template/` — Next.js суурь төсөл + Dockerfile. `node_modules`-ийг
    image дотор УРЬДЧИЛАН суулгана → preview болгонд npm install хийхгүй
  - controller-д **app горим**: template image-ээс контейнер асаана →
    хэрэглэгчийн файл template-ийн файлыг дарж бичигдэнэ → `next dev` →
    бэлэн болтол хүлээнэ (90 сек хүртэл) → URL буцаана
  - Next.js-д 1GB RAM / 2 CPU (static-д 512MB/1 CPU хэвээрээ)
  - UI: "Static" / "Next.js апп ⚛️" горим сонгогч, useState-тэй жишээ
- ✅ **Бүрэн туршиж баталсан:** custom `app/page.js` өгөөд контейнер аслаа,
  Next.js render хийсэн (200, _next asset-ууд гарсан), устгал цэвэрхэн

**Дадлагаар мэдсэн зүйл:**
- Удаан сүлжээнд npm install контейнер дотор timeout болдог →
  Dockerfile-д `NPM_REGISTRY` build-arg нэмсэн. Ажилласан build:
  `docker build --build-arg NPM_REGISTRY=https://registry.npmmirror.com -t kodu-template-next .`
- Арын дэвсгэрийн урт ажил session солигдоход тасардаг — том build-ийг
  тасалдвал дахин эхлүүлэхэд Docker layer cache тусалдаг

---

## ⬜ Дараа юунаас үргэлжлүүлэх вэ — M3 + API үйлчилгээ болгох

- API түлхүүрийн шалгалт (`Authorization: Bearer ...`) — тусдаа үйлчилгээ
  болохын эхний алхам
- Цэвэр Preview URL routing (санамсаргүй порт биш)
- Дулаан контейнерийн pool (Next.js-ийн асах хугацааг нуух)
- Сүлжээний хязгаарлалт (аюулгүй байдал)
- Хожим: VPS дээр байрлуулах → KoDu-д client бичих → E2B-тэй зэрэгцээ shadow-тест

---

## 🔁 Дараагийн session-д хэрхэн эргэж эхлэх вэ

1. Docker Desktop нээ → "Engine running" ногоон болтол хүлээ
2. PowerShell → `controller/` фолдер руу `cd` хий
3. `npm run dev` → `localhost:4000` нээ
4. Ажиллаж байгааг батал (Preview үүсгэ)
5. Дараа нь M2 руу үргэлжил

> Зарчим хэвээрээ: **өдөр бүр 1%. Бид яарахгүй.** 🐢
