# client/ — Kodu Sandbox API client (адаптер)

KoDu-APP (болон бусад client) энэ модулиар SAND-ыг дуудна. **E2B client-тэй
ойролцоо интерфейс** тул хожим E2B-ээс SAND руу шилжихэд зөвхөн энэ адаптерийг
солих замаар шилжинэ ([architecture.md](../docs/architecture.md)).

- Шаардлага: **Node 18+** (доторх `fetch`). Гуравдагч сан хэрэггүй.
- Файл хуулж ашиглаж болно, эсвэл `require("./client")`.

## Хэрэглээ

```js
const { KoduSandbox } = require("./client");

const sb = new KoduSandbox({
  baseUrl: "https://prw.hisainuu.online", // эсвэл http://202.182.123.79:4000
  apiKey: process.env.SAND_KEY,
});

// Preview үүсгэх (static эсвэл Next.js app)
const { id, url } = await sb.createPreview(files, { mode: "app", ttlMin: 30 });
// → хэрэглэгчид url-ийг үзүүл (iframe эсвэл шинэ tab)

await sb.keepAlive(id);   // ашиглаж байгаа цагт тогтмол дуудаж амьд байлга
await sb.stopPreview(id); // дуусахад устга
```

### Методууд

| Метод | Үүрэг |
|-------|-------|
| `createPreview(files, {mode, ttlMin})` | Preview үүсгэнэ → `{id, url, warm}` |
| `createAndWait(files, opts)` | Үүсгээд бэлэн болтол хүлээнэ → `{id, url, warm, readyMs}` |
| `keepAlive(id, ttlMin?)` | Устах цагийг сунгана |
| `stopPreview(id)` | Зогсоож устгана |
| `list()` | Ажиллаж буй preview-ууд |

## Shadow-тест

M5-ийн санаа: KoDu-APP хэрэглэгчийн сайтыг **E2B дээр** үзүүлж байх зуур,
**зэрэгцээ SAND дээр ч** үүсгээд "ажиллаж байна уу, хэр хурдан бэ" гэдгийг
чимээгүй бүртгэнэ. Хэрэглэгч SAND-ийн preview-г харахгүй — амьд бүтээгдэхүүн
эрсдэлд орохгүй.

`shadow-test.js` тэр баталгаажуулалтыг гүйцэтгэнэ (static + app preview үүсгэж,
агуулга зөв, keepAlive/list/stop ажиллаж байгааг шалгана):

```bash
SAND_URL=http://202.182.123.79:4000 SAND_KEY=<түлхүүр> node client/shadow-test.js
```

Бүх шалгалт PASS бол SAND нь KoDu-д холбогдоход бэлэн.
