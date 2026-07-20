# 📡 Kodu Sandbox API — лавлах (KoDu-APP-д зориулсан)

> app.kodu.live энэ API-гаар preview үүсгэнэ. Базовый хаяг (домэйн горимд):
> `https://prw.hisainuu.online`  (эсвэл түр `http://202.182.123.79:4000`)

## Баталгаажуулалт

Бүх `/api/*` хүсэлт дараах header шаардана:

```
Authorization: Bearer <API_KEY>
```

Түлхүүр серверийн `controller/.kodu-key` файлд байдаг. Буруу/дутуу бол `401`.
IP тус бүр минутад 30 хүсэлт (`429` хэтэрвэл).

---

## 1. Preview үүсгэх

```
POST /api/previews
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

**Body:**
```json
{
  "mode": "expo",
  "files": [
    { "path": "src/App.tsx", "content": "export default function App(){...}" }
  ],
  "ttlMin": 30
}
```

- `mode`: `"static"` (HTML/CSS/JS) | `"app"` (Next.js) | **`"expo"`** (react-native-web) ← апп-д зориулсан
- `files`: `[{ path, content }]` массив. **Expo-д хэрэглэгчийн код `src/App.tsx` зам дээр илгээнэ** (template-ийн placeholder-ийг дарж бичнэ). Хэд ч файл болно (олон файлтай төсөл дэмжинэ).
- `ttlMin` (заавал биш): амьдрах хугацаа минутаар (default 15, дээд 480).

**Хариу (200):**
```json
{
  "id": "9f7c2a1b6e03...",
  "url": "https://9f7c2a1b6e03.prw.hisainuu.online",
  "warm": false
}
```

- `id`: preview-ийн ID (keepalive/update/stop-д ашиглана)
- `url`: **HTTPS preview хаяг** — iframe-д шууд суулгаж болно
- Хязгаар: ≤50 файл, файл ≤512KB, нийт ≤2MB

---

## 2. Файл шинэчлэх (hot reload)

Шинэ контейнер асаахгүйгээр байгаа preview-ийн кодыг шинэчилнэ (Vite HMR).
**Засвар хийх бүрт үүнийг дуудна — шинэ preview үүсгэхгүй.**

```
PUT /api/previews/:id/files
{ "files": [{ "path": "src/App.tsx", "content": "..." }] }
```
→ `{ "ok": true }` (эсвэл `404` preview олдоогүй)

---

## 3. Keepalive (амьд байлгах)

Preview идэвхгүй байвал TTL дуусахад устана. Ашиглаж байгаа цагт (жишээ
**5 мин тутам**) энийг дуудаж амьд байлга — цаг 0-оос дахин тоолно.

```
POST /api/previews/:id/keepalive
{ "ttlMin": 30 }   // заавал биш
```
→ `{ "ok": true }`

---

## 4. Жагсаах / Устгах

```
GET    /api/previews          → [{ id, url, state }]
DELETE /api/previews/:id      → { ok: true }
```

---

## Асуултуудын хариу (App agent-д)

| Асуулт | Хариу |
|--------|-------|
| Endpoint + method | `POST /api/previews` |
| API key header | `Authorization: Bearer <key>` |
| Body формат | JSON: `{ mode:"expo", files:[{path,content}], ttlMin? }` |
| Хариу | `{ id, url, warm }` — `url` бол HTTPS preview |
| TTL | Default 15 мин **идэвхгүй** байвал. `ttlMin`-ээр тохируулна (дээд 480). Keepalive-аар сунгана |
| Файл шинэчлэх (hot reload)? | **Тийм** — `PUT /api/previews/:id/files`. Vite HMR хийнэ. Дахин үүсгэх шаардлагагүй |
| Зэрэг хэдэн preview? | Серверийн RAM-аас хамаарна. Expo preview ~768MB → одоогийн 2GB серверт ~2 зэрэг. Сервер томруулбал шугаман нэмэгдэнэ |

## 🔴 Техникийн шаардлагууд — SAND талд шийдэгдсэн

- ✅ **HTTPS** — Caddy on-demand TLS (`https://<id>.prw.hisainuu.online`)
- ✅ **iframe-д суулгаж болно** — SAND нь `X-Frame-Options` / `frame-ancestors`
  ТАВЬДАГГҮЙ. app.kodu.live-г хаах юм байхгүй ← iframe-д чөлөөтэй суулгана
- ✅ **Утасны хэмжээ** — preview нь агуулгаа дүүрэн эзэлнэ; iframe-ийн өргөнөө
  ~390px болговол утасны харагдац гарна
- ✅ **Багцууд урьдчилж суусан** — template image-д `react-native-web`, `vite`
  бэлэн (npm install хийхгүй)

## ⚠️ Anхааруулгын хариу

- **`Alert.alert`** — react-native-web дээр анхнаасаа ажилладаггүй. **SAND
  template polyfill хийсэн** (browser `alert`/`confirm`-оор) → **ажиллана!**
  Товчтой (buttons) `Alert.alert` бол `confirm` болж, зөв `onPress` дуудагдана.
  Prompt-оо өөрчлөх шаардлагагүй.
- **`StatusBar`, `KeyboardAvoidingView`** — браузерт нөлөөгүй (no-op), алдаа
  өгөхгүй. Асуудалгүй.
- Дэмжигдсэн RN API-ууд: `View, Text, ScrollView, FlatList, Pressable,
  TextInput, Image, StyleSheet, Dimensions, Platform, StatusBar, Alert,
  Animated, KeyboardAvoidingView` — react-native-web бүгдийг дэмжинэ.

## Client адаптер

JS-ээс дуудах бол [`client/`](../client/README.md) ашиглаж болно:
```js
const { KoduSandbox } = require("./client");
const sb = new KoduSandbox({ baseUrl, apiKey });
const { id, url } = await sb.createPreview(files, { mode: "expo", ttlMin: 30 });
```
