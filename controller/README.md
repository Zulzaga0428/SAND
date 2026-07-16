# controller/ — Kodu Sandbox Preview Controller (M2)

Kodu Sandbox-ийн **цөм**: Node + [`dockerode`] ашиглан контейнерийг **кодоор**
асааж, төслийн файлуудыг дотор нь бичээд, preview URL буцаадаг — яг KoDu
хийдэг зарчим.

```
Файлууд бичнэ → controller код → Docker контейнер асаана
             → файлуудыг tar-аар контейнер руу бичнэ (putArchive)
             → порт нээнэ → preview URL
```

## Юу хийдэг вэ (M2)

- ✅ Кодоор контейнер **асаана / жагсаана / устгана**
- ✅ **Олон файлтай төсөл** (HTML + CSS + JS + дэд фолдер) дэмжинэ
  - Файлуудыг tar архив болгож `putArchive`-аар контейнер руу бичнэ —
    жинхэнэ sandbox-уудын (E2B гэх мэт) ашигладаг арга
  - Контейнер доторх static сервер зөв Content-Type-тэйгээр үзүүлнэ
- ✅ UI нь файлын tab-тай жижиг editor — файл нэмэх/устгах боломжтой
- ✅ Контейнер бүр **чөлөөт порт** авч, browser-д preview харуулна
- ✅ Аюулгүй байдлын дүрмүүд суулгасан:
  - 🔒 root биш хэрэглэгч (`User: node`)
  - 🔒 512MB RAM, 1 CPU, 256 process хязгаар
  - 🔒 15 мин дараа **автоматаар устана** (ephemeral)
  - 🔒 Файлын зам шалгана (`..` хориглоно, path traversal хамгаалалт)

## Урьдчилсан шаардлага

- **Docker Desktop** ажиллаж байх ёстой (халим 🐳 ногоон "running")
- **Node.js** суусан байх ([nodejs.org](https://nodejs.org) — LTS хувилбар)

## Ажиллуулах

Terminal (PowerShell) дээр:

```bash
cd controller
npm install
npm run dev
```

Дараа нь browser дээр нээ:

```
http://localhost:4000
```

→ Файлуудаа бич (tab-аар сэлгэ, `+`-ээр нэм) → **"Preview үүсгэх"** дар →
код контейнер асааж, шинэ tab-д сайт чинь гарч ирнэ. 🎉

## API

| Хүсэлт | Үүрэг |
|--------|-------|
| `POST /api/previews` | `{ files: [{path, content}, ...] }` → контейнер асаана, `{id, url}` буцаана. (`{html: "..."}` хуучин хэлбэрийг ч дэмжинэ) |
| `GET /api/previews` | Ажиллаж буй preview-уудын жагсаалт |
| `DELETE /api/previews/:id` | Preview зогсоож устгана |

## Файлууд

| Файл | Үүрэг |
|------|-------|
| `sandbox.js` | ЦӨМ — dockerode: контейнер + tar/putArchive логик |
| `server.js` | HTTP сервер + API |
| `public/index.html` | Хяналтын самбар — файлын tab-тай editor |

## Дараагийн алхам (M2.5 / M3)

- **Next.js/Vite төслийг** контейнер дотор `npm install && npm run dev`-ээр
  ажиллуулах (үүнд урьдчилан бэлдсэн template image хэрэгтэй)
- Preview URL-ийг цэвэр домэйн болгож routing хийх
- Дулаан контейнерийн pool (хурд)

[`dockerode`]: https://github.com/apocas/dockerode
