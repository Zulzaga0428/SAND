# 🐳 Kodu Sandbox — Чадварын бүрэн тайлан (State of SAND)

> Бүх агент (CEO, web, app) уншиж контекст болгох. Шинэчлэгдсэн: 2026-07.
> Товч: **SAND бол Kodu-гийн өөрийн preview engine — E2B-г орлохоор бүтээгдсэн,
> Токиогийн серверт 24/7 амьд ажиллаж байна.**

---

## 0. 🎯 SAND юу вэ (нэг өгүүлбэрээр)

Хэрэглэгчийн үүсгэсэн код (сайт/апп)-ыг **тусгаарлагдсан Docker контейнерт
аюулгүй ажиллуулж, HTTPS preview URL буцаадаг** үйлчилгээ. E2B хийдэг ажлыг
**өөрийн серверт, өөрийн эзэмшилд** хийнэ. Сард E2B-д $150 төлөхийн оронд
$10-ийн серверээр ажиллана.

---

## 1. ☁️ Дэд бүтэц (Infrastructure)

| Зүйл | Тодорхойлолт |
|------|--------------|
| Сервер | Vultr VPS, **Токио** 🇯🇵, Ubuntu 24.04, IP `202.182.123.79` |
| Хэмжээ | 1 vCPU / 2GB / 55GB · ~$10/сар |
| Ажиллагаа | **24/7 автомат** — systemd service (сервер асахад өөрөө асна, унавал сэргэнэ) |
| Суулгалт | Нэг командаар (`deploy/setup.sh`): Docker + Node + repo + template + service + галт хана |
| Зардал | **$10/сар (E2B $150/сар-ыг орлоно → $140/сар хэмнэлт)** |

---

## 2. ⚡ Preview Engine (гол чадвар)

**3 горим** дэмждэг:
- **`static`** — HTML/CSS/JS сайт (жижиг node сервер)
- **`app`** — Next.js апп (node_modules бэлэн template)
- **`expo`** — React Native апп (react-native-web + Vite) ← app.kodu.live үүнийг ашиглана

**Онцлогууд:**
- ♨️ **Дулаан pool** (Next.js) — preview **~1 секундэд** гарна (урьдчилан асаастай)
- 📦 **Олон файлтай төсөл** — tar/putArchive-аар контейнерт бичнэ
- 🔥 **Hot reload** — засвар бүрт шинэ контейнер асаахгүй, файл шинэчилнэ (`PUT /files`)
- ⏱️ **Уян TTL + keepalive** — идэвхгүй байвал устана, ашиглаж байвал амьд (15 мин default, тохируулж болно)
- 🧊 **Ephemeral** — ажил дуусмагц контейнер өөрөө устана (RAM/CPU чөлөөлнө)

---

## 3. 🌐 Домэйн + HTTPS

- **Жинхэнэ домэйн:** `prw.kodu.live` (+ `prw.hisainuu.online` шилжилтийн үед зэрэг)
- **Wildcard subdomain:** preview бүр өөрийн хаягтай — `https://<id>.prw.kodu.live`
  (яг E2B-ийн `xxx.e2b.app` шиг)
- **Автомат HTTPS:** Caddy on-demand TLS (Let's Encrypt) — subdomain бүрд автомат гэрчилгээ
- **Олон домэйн зэрэг** — домэйн солиход preview тасрахгүй (аюулгүй шилжилт)
- iframe-д шингэнэ (X-Frame-Options тавьдаггүй) → app.kodu.live дотор preview харагдана

---

## 4. 🔒 Аюулгүй байдал (9 давхар хамгаалалт)

Хэрэглэгчийн **итгэлгүй код** ажилладаг тул олон давхар хана:

1. Root биш хэрэглэгч (`User: node`)
2. Бүх Linux capability хассан (`CapDrop: ALL`)
3. `no-new-privileges` (эрх нэмэгдүүлэх хаалттай)
4. Нөөцийн хязгаар (RAM/CPU/PID/swap)
5. Ephemeral (15 мин дараа устана)
6. Контейнер хооронд тусгаарлалт (`icc=false`)
7. **Egress firewall** — контейнер интернэт/метадата/host руу гарч чадахгүй (iptables)
8. API түлхүүр (Bearer) + rate limit (IP-д 30/мин)
9. Оролтын хязгаар (≤50 файл, ≤512KB/файл, ≤2MB)

**🎯 Халдлагын туршилт (red-team): 5/5 PASS** — интернэт, метадата, capability,
no-new-privs, контейнер тусгаарлалт бүгд хаагдсан нь батлагдсан.
Нууц түлхүүр repo-д хэзээ ч ордоггүй (`.kodu-key`, `.gitignore`).

---

## 5. 📡 API + Client

**REST API** (Bearer түлхүүрээр хамгаалагдсан):
| Endpoint | Үүрэг |
|----------|-------|
| `POST /api/previews` | Preview үүсгэх → `{id, url, warm}` |
| `PUT /api/previews/:id/files` | Файл шинэчлэх (hot reload) |
| `POST /api/previews/:id/keepalive` | Амьд байлгах |
| `GET /api/previews` | Жагсаах |
| `DELETE /api/previews/:id` | Устгах |
| `GET /__speedtest?mb=N` | Хурд хэмжих |

**Client SDK** (`client/index.js`) — `KoduSandbox` class, E2B-тэй ойролцоо
интерфейс. KoDu-APP энгийн import-оор дуудна.

---

## 6. 🎨 App.kodu.live-ийн runtime

- **Expo/react-native-web template** (Vite) — react-native код браузерт preview
- `react-native` → `react-native-web` alias, `Alert.alert` polyfill
- **Preview = Export баталгаа:** App.tsx preview болон жинхэнэ Expo export-д ижил ажиллана
- **Цэвэр runtime:** component kit-ийг **app.kodu.live эзэмшдэг** (SAND зөвхөн runtime
  prebake хийнэ — E2B шиг тэнэг runtime)

---

## 7. 🔗 Интеграци (амьд)

- ✅ **app.kodu.live SAND-тай холбогдсон** — native апп preview амьдаар гарч байна
- ✅ Жишээ: кофе шопын апп `https://<id>.prw.kodu.live` дээр амжилттай зурагдсан 📱
- ✅ app.kodu.live-д: **Preview 1 = SAND** (хурдан), **Preview 2 = Vercel** (fallback)

---

## 8. 🏛️ Архитектурын зарчим

- **SAND = E2B шиг тэнэг runtime** — зүгээр код ажиллуулна. Контент (kit, template)
  = агентууд эзэмшинэ (web agent template авчирдаг шиг)
- **Тусдаа үйлчилгээ + API** — KoDu-гийн кодтой холбоогүй, зөвхөн API-аар
- **Зэрэгцээ зам:** E2B web-д амьд үйлчилсээр, SAND-ыг app дээр тэстэлж байна
  → батлагдвал web-ээ ч SAND руу шилжүүлнэ

---

## 9. ✅ ОДОО АМЬД АЖИЛЛАЖ БАЙГАА

```
✅ Sandbox engine   → Токио VPS, 24/7 автомат
✅ Preview          → https://<id>.prw.kodu.live (HTTPS, wildcard)
✅ app.kodu.live    → native апп preview амьд
✅ Хамгаалалт       → 9 давхар, 5/5 red-team PASS
✅ Landing          → Railway (танилцуулга)
✅ Бүх код          → GitHub (Zulzaga0428/SAND), баримт бичиг монголоор
```

---

## 10. 🗺️ Замын зураг — юу үлдсэн

**Хийгдсэн:** M0 (Docker) → M1 (preview) → M2 (олон файл) → M2.5 (Next.js) →
M3 (warm pool + HTTPS routing) → M4 (аюулгүй байдал) → домэйн → app.kodu.live интеграци

**Дараа:**
- ⚡ **Expo warm pool** — expo preview агшинд гарна (одоо ~30 сек cold)
- 📈 **Scale** — олон сервер, олон хэрэглэгч зэрэг
- 🌐 **Web шилжүүлэх** — kodu.live-ийг E2B-ээс SAND руу → $150/сар хэмнэнэ (том зорилго)
- 🔒 **v2 хамгаалалт** — gVisor/microVM (олон нийтэд нээхэд)

---

## 11. 📊 Тоо баримт (гайхалтай хэсэг)

- **Хугацаа:** "Docker гэж юу вэ?"-ээс амьд sandbox хүртэл — **~3-4 хоног**
  (мастер төлөвлөгөө үүнийг 6-9 сарын ажил гэж тооцоолсон)
- **Preview хурд:** ~1 сек (warm) / ~30 сек (expo cold — warm pool-оор багасна)
- **Зардал:** $10/сар (E2B $150/сар-ыг орлоно)
- **Аюулгүй байдал:** 5/5 red-team PASS
- **Компонент runtime:** react-native-web, preview=export баталгаатай

---

## 12. 💡 Нэг өгүүлбэрийн дүгнэлт

> Kodu одоо **гуравдагч этгээдийн (E2B) түрээсийн gal тогоог** ашиглахаа больж,
> **өөрийн, аюулгүй, хямд, 24/7 sandbox дэд бүтэцтэй** боллоо — app.kodu.live
> түүн дээр амьд ажиллаж, web ч удахгүй шилжинэ.
