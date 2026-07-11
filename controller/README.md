# controller/ — Kodu Sandbox Preview Controller (M1)

Kodu Sandbox-ийн **цөм**: Node + [`dockerode`] ашиглан контейнерийг **кодоор**
асааж, preview URL буцаадаг. Чиний гараар хийсэн `nginx` preview-г **автомат**
болгосон хувилбар — яг KoDu хийдэг зарчим.

```
HTML бичнэ → controller код → Docker контейнер асаана → порт нээнэ → preview URL
```

## Юу хийдэг вэ (M1)

- ✅ Кодоор контейнер **асаана / жагсаана / устгана**
- ✅ Контейнер бүр **чөлөөт порт** авч, browser-д preview харуулна
- ✅ Аюулгүй байдлын дүрмүүд суулгасан:
  - 🔒 root биш хэрэглэгч (`User: node`)
  - 🔒 512MB RAM, 1 CPU, 256 process хязгаар
  - 🔒 15 мин дараа **автоматаар устана** (ephemeral)

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

→ HTML бич → **"Preview үүсгэх"** дар → код контейнер асааж, шинэ tab-д
preview чинь гарч ирнэ. 🎉

## Файлууд

| Файл | Үүрэг |
|------|-------|
| `sandbox.js` | ЦӨМ — dockerode-оор контейнер удирдах логик |
| `server.js` | HTTP сервер + API |
| `public/index.html` | Хяналтын самбар (browser UI) |

## Дараагийн алхам (M2)

- Хэрэглэгч бүрт олон файлтай **бүтэн төсөл** (зөвхөн нэг HTML биш)
- Next.js төслийг контейнер дотор `npm run dev`-ээр ажиллуулах
- Preview URL-ийг цэвэр домэйн болгож routing хийх

[`dockerode`]: https://github.com/apocas/dockerode
