# controller/ — Kodu Sandbox Preview Controller (M2.5)

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
- ✅ **Хоёр горим:**
  - **Static** — HTML/CSS/JS файлуудыг жижиг static сервер үзүүлнэ (шууд асна)
  - **App ⚛️** — **жинхэнэ Next.js апп** `node_modules` бэлэн template image
    дээр `next dev`-ээр ажиллана (эхлээд `template/`-ийг build хийсэн байх ёстой)
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
- **App горимд:** Next.js template image-ийг нэг удаа build хийсэн байх:
  ```bash
  cd template
  docker build -t kodu-template-next .
  ```

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

🔑 **Бүх API хүсэлт түлхүүр шаардана** (architecture.md — тусдаа үйлчилгээ):

- Controller анх асахад түлхүүр автоматаар үүсч `controller/.kodu-key` файлд
  хадгалагдана (git-д орохгүй), терминалд 🔑 гэж хэвлэгдэнэ
- Хүсэлт бүрт: `Authorization: Bearer <түлхүүр>` header
- Самбар (browser UI) нээхэд түлхүүрийг нэг удаа асууна — localStorage-д санана
- Серверт өөр түлхүүр өгөх бол: `KODU_SANDBOX_KEY` орчны хувьсагч

Хамгаалалт: буруу/дутуу түлхүүр → `401`. Оролтын хязгаар: ≤50 файл,
файл бүр ≤512KB, нийт ≤2MB.

| Хүсэлт | Үүрэг |
|--------|-------|
| `POST /api/previews` | `{ files: [{path, content}, ...], mode: "static"\|"app" }` → контейнер асаана, `{id, url}` буцаана. (`{html: "..."}` хуучин хэлбэрийг ч дэмжинэ) |
| `GET /api/previews` | Ажиллаж буй preview-уудын жагсаалт |
| `DELETE /api/previews/:id` | Preview зогсоож устгана |

## Файлууд

| Файл | Үүрэг |
|------|-------|
| `sandbox.js` | ЦӨМ — dockerode: контейнер + tar/putArchive логик |
| `server.js` | HTTP сервер + API |
| `public/index.html` | Хяналтын самбар — файлын tab-тай editor |

## Дараагийн алхам (M3)

- Preview URL-ийг цэвэр домэйн болгож routing хийх
- Дулаан контейнерийн pool (хурд — Next.js-ийн асах хугацааг нуух)
- Сүлжээний хязгаарлалт (аюулгүй байдал)

[`dockerode`]: https://github.com/apocas/dockerode
