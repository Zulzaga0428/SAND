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

## ✅ Өдөр 2 (үргэлжлэл) — API түлхүүр + оролтын хязгаар (2026-07-17)

- ✅ **API түлхүүр** — тусдаа үйлчилгээ болохын эхний алхам:
  - Анх асахад автоматаар үүсч `.kodu-key`-д хадгалагдана (git-д орохгүй)
  - `/api/*` бүгд `Authorization: Bearer <түлхүүр>` шаардана, буруу бол 401
  - Хугацааны халдлагаас хамгаалсан харьцуулалт (timingSafeEqual)
  - Самбар түлхүүрийг нэг удаа асуугаад localStorage-д санана
- ✅ **Оролтын хязгаар:** ≤50 файл, файл ≤512KB, нийт ≤2MB — тодорхой алдаа буцаана
- ✅ **Туршиж баталсан:** түлхүүргүй 401 / буруу түлхүүр 401 / зөв түлхүүр 200,
  бүтэн урсгал ажилласан, 600KB файл зөв татгалзсан

---

## ✅ Өдөр 2 (үргэлжлэл) — Landing сайт Railway дээр АМЬД (2026-07-17)

- ✅ `landing/` — Kodu Sandbox танилцуулга сайт (express + static, DB/Docker хэрэггүй)
- ✅ Railway дээр deploy хийсэн (Root Directory = `landing` тохиргоо чухал байсан!)
- 🌍 **Амьд линк:** https://sand-production.up.railway.app/
- ✅ Бүх хэсэг зөв гарч байгааг шалгасан (hero, боломжууд, алхмууд, замын зураг)
- 💡 Домэйний шийдвэр: одоохондоо Railway subdomain хангалттай.
  Жинхэнэ домэйн (жишээ: kodusandbox.mn)-ийг **VPS авахтай зэрэг** авна —
  учир нь wildcard preview URL (`*.p.домэйн`) тэр үед л хэрэгтэй болно.

---

## ✅ Өдөр 2 (үргэлжлэл) — ♨️ Дулаан pool + 🔒 сүлжээний тусгаарлалт (2026-07-17)

- ✅ **Дулаан pool:** Next.js контейнеруудыг урьдчилан асаагаад бэлэн байлгадаг
  боллоо. Хэрэглэгч ирэхэд бэлэн контейнерт файлыг нь putArchive хийхэд
  next dev hot-reload хийгээд шууд бэлэн.
  - **Хэмжсэн үр дүн: preview 10–30 сек → 0.7 секунд** 🤯
  - Pool автоматаар нөхөгддөг (WARM_POOL_SIZE env, default 1)
  - Controller асахдаа өмнөх ажиллагааны хоцрогдсон контейнеруудыг цэвэрлэдэг
- ✅ **Сүлжээний тусгаарлалт:** бүх preview контейнер `kodu-sandbox-net`
  (bridge, `enable_icc=false`) сүлжээнд ажилладаг боллоо.
  - **Туршиж баталсан:** контейнер хоорондын ping 100% packet loss —
    нэг preview нөгөө рүү халдаж чадахгүй 🔒
  - Гадагшаа (интернэт рүү) хандалтыг бүрэн хаах ажил VPS дээр iptables-ээр
    хийгдэнэ (Docker Desktop дээр боломж хязгаарлагдмал)

---

## 🎉🎉 Өдөр 2 (ОРГИЛ) — VPS дээр 24/7 АМЬД боллоо! (2026-07-17)

- ✅ **Vultr VPS** авсан: Tokyo, Ubuntu 24.04, 1 vCPU / 2GB, ~$10/сар
  - IP: `202.182.123.79`
- ✅ **Нэг командаар суулгасан** (`deploy/setup.sh`): Docker + Node + repo +
  template build + systemd service + ufw — бүгд автоматаар
- ✅ **Дэлхийд амьд:** `http://202.182.123.79:4000` самбар нээгдэж байна
- ✅ **Next.js preview ГАР УТСАН дээр** нээгдсэн 📱 — Токиогийн серверээс,
  контейнер дотроос, useState товч ажиллаж байна. **БҮХ СИСТЕМ END-TO-END
  АЖИЛЛАЖ БАЙНА!** 🐳⚛️🌍

**Замд тохиолдсон, зассан зүйлс:**
- Repo Private байсан → серверээс татаж чадаагүй (404) → **Public болгосон**
- Preview URL `localhost` гэж гарч байсан → `PUBLIC_HOST` env-ээр серверийн
  IP тавьдаг болгосон (systemd drop-in override-оор тохируулсан)
- App горим 2 CPU байсан → 1 vCPU VPS-д таарахгүй → `CPUS_APP` default 1 болгов
- Desktop дээр `ERR_TOO_MANY_REDIRECTS` — browser cookie/cache quirk (raw IP-д),
  incognito-д ажилладаг. Домэйн + HTTPS хийхээр арилна.

---

## ✅ Өдөр 2 (үргэлжлэл) — 🔒 Хамгаалалт чангатгах (2026-07-17)

> Зорилго: KoDu-тай холбохоос ӨМНӨ sandbox-оо "цоожтой цайз" болгох.
> Дэлгэрэнгүй: [security.md](security.md)

- ✅ **Контейнер хатуужуулалт** (код, туршиж баталсан локалд):
  - `CapDrop: ["ALL"]` — бүх Linux эрх хасагдсан (CapEff=0000...000 ✅)
  - `SecurityOpt: no-new-privileges` — эрх нэмэгдүүлэх хаагдсан (NoNewPrivs=1 ✅)
  - swap=0 (RAM хязгаар үнэхээр биелнэ), uid=1000 non-root
  - Next.js хатуужуулсан контейнерт 0.8 сек хэвээр ажилласан ✅
- ✅ **API rate limit** — IP-д минутад 30 хүсэлт (429), DoS-оос хамгаална
- ✅ **Egress firewall скрипт** (`deploy/harden.sh`): iptables DOCKER-USER-ээр
  sandbox subnet-ээс ГАДАГШ шинэ холболтыг хаана (интернэт, метадата, host).
  Ачаалах бүрт автомат сэргэдэг systemd unit.
- ✅ **Халдлагын туршилт** (`deploy/redteam-test.sh`): 5 халдлага оролдож,
  бүгд хаагдсаныг батална (интернэт, метадата, cap, no-new-privs, icc).
- ✅ **VPS ДЭЭР АЖИЛЛУУЛЖ БАТАЛСАН** (202.182.123.79):
  `harden.sh` суусан, `redteam-test.sh` → **PASS=5 FAIL=0** 🔒
  (эхний хувилбарт 1,2-р тест timeout+функцийн алдаанаас хуурамч PASS өгч
  байсныг node TCP тестээр зассан — одоо egress жинхэнээсээ хаагдсан нь батлагдсан)

**Одоогийн байдал: sandbox КoDu-тай холбоход БЭЛЭН, хамгаалалт бат.**

---

## ✅ Өдөр 3 — ⏱️ Уян TTL/keepalive + 🌐 HTTPS subdomain routing (M3)

- ✅ **Уян TTL + keepalive:** preview идэвхгүй байвал (default 15 мин) устана,
  keepalive хийвэл цаг 0-оос дахин тоолно — ашиглаж байвал амьд.
  `KODU_TTL_MIN` env, per-request `ttlMin`, дээд хязгаар 8 цаг.
  `POST /api/previews/:id/keepalive` endpoint. Локалд туршиж баталсан (Тест A ✅).
- ✅ **HTTPS subdomain routing (M3):** preview URL нь `http://IP:port` биш
  **`https://<id>.<домэйн>`** болно (E2B шиг).
  - DNS: `prw.hisainuu.online` + `*.prw.hisainuu.online` → VPS IP (wildcard баталсан)
  - Controller дотор http-proxy: `<id>.домэйн` → зөв контейнер (Host-based routing)
  - Контейнер порт зөвхөн `127.0.0.1`-д (гаднаас шууд хүрэхгүй, зөвхөн proxy-гоор)
  - `deploy/https.sh`: Caddy суулгаж, on-demand TLS (Let's Encrypt), Caddyfile,
    PREVIEW_DOMAIN тохируулна
  - **Локалд бүрэн туршиж баталсан** (Host header дуурайлган):
    static ✅ / Next.js app ✅ proxy-гоор ажиллав, ask endpoint 200/403 зөв
  - Шийдсэн: static минимал сервер http-proxy keep-alive-тай ECONNRESET өгч
    байсныг `agent:false`-ээр зассан
- ⬜ **VPS дээр ажиллуулах үлдсэн:** `git pull` → `bash deploy/https.sh prw.hisainuu.online`

**Энэ алхмаар шийдэгдэх зүйлс:** HTTPS ✅ (iframe mixed-content блок арилна) +
цэвэр URL ✅ + preview тус бүр тусдаа origin ✅ + desktop redirect quirk ✅

---

## ✅ Өдөр 3 — ⏱️ Уян хатан TTL + keepalive (2026-07-18)

> Асуулт: "sandbox 15 минутаас урт амьдрахгүй юу?" → Уян хатан болголоо.

- ✅ **keepalive** механизм: preview-ийг ашиглаж байвал амьд байлгана, зөвхөн
  **идэвхгүй** TTL хугацаанд л устана (E2B-ийн загвар). `POST /api/previews/:id/keepalive`
- ✅ **TTL тохируулж болдог:** `KODU_TTL_MIN` env (default 15, бутархай минут дэмжинэ),
  эсвэл хүсэлт бүрт `ttlMin`. Аюулгүйн дээд хязгаар 8 цаг.
- ✅ `scheduleTTL` туслах — таймерыг цэвэрлээд дахин тавьдаг (keepalive-д ашиглана)
- 🐞 Зассан: `parseInt("0.15")→0` алдаа → `parseFloat` болгов (бутархай минут зөв)
- ✅ **Туршиж баталсан (локал, Docker):**
  - keepalive-гүй → TTL-ээр устсан ✅
  - keepalive (5сек тутам) → TTL-ээс урт (18сек) амьд байсан ✅
- ⬜ Сервер дээр deploy: `git pull && systemctl restart kodu-sandbox`

---

## ⬜ Дараа юунаас үргэлжлүүлэх вэ — M3 (домэйн + HTTPS)

- Домэйн авах (kodusandbox.mn эсвэл хямд .com/.dev)
- DNS: `api.домэйн` → IP, `*.p.домэйн` → IP (wildcard)
- **Caddy reverse proxy** → HTTPS + цэвэр preview URL (raw IP redirect quirk ч арилна)
- Гадагшаа сүлжээг iptables-ээр хаах (аюулгүй байдлын сүүлийн алхам)
- Дараа нь: KoDu-д client бичих → E2B-тэй зэрэгцээ shadow-тест (M5)

---

## 🔁 Дараагийн session-д хэрхэн эргэж эхлэх вэ

1. Docker Desktop нээ → "Engine running" ногоон болтол хүлээ
2. PowerShell → `controller/` фолдер руу `cd` хий
3. `npm run dev` → `localhost:4000` нээ
4. Ажиллаж байгааг батал (Preview үүсгэ)
5. Дараа нь M2 руу үргэлжил

> Зарчим хэвээрээ: **өдөр бүр 1%. Бид яарахгүй.** 🐢
