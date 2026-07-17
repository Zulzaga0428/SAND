# 🐳 Kodu Sandbox

> Хэрэглэгчийн сайтуудыг **өөрсдийн серверт** аюулгүй ажиллуулж, preview хийх engine.
> KoDu одоо E2B (гуравдагч cloud) ашигладаг — энэ төсөл түүнийг **өөрийн Docker sandbox**-оор солино.

🌍 **Landing сайт (амьд):** https://sand-production.up.railway.app/

```
Одоо:    Kodu → E2B → Preview
Ирээдүй: Kodu → (API) → Kodu Sandbox → Preview
```

## Зарчим

**Өдөр бүр 1%. Нэг асуудал → нэг шийдэл → дараагийнх. Бид яарахгүй.**

- 🟢 E2B амьд хэрэглэгчдэд үйлчилсээр байна — эрсдэлд оруулахгүй
- 🔨 Түүний **зэрэгцээ** энд Kodu Sandbox v1-ийг эхнээс нь барина
- ✅ v1 баталгаажиж, аюулгүй болсон үед л E2B-г солино

## Энэ repo юуны тухай вэ

Энэ бол **KoDu төслөөс тусдаа**, цэвэр шинэ repo — [бие даасан API үйлчилгээ](docs/architecture.md).
KoDu хожим зөвхөн API-аар холбогдоно (яг E2B шиг). KoDu-гийн үндсэн кодод хүрэхгүй.

## Одоо юу ажилладаг вэ

- ✅ **M1** — кодоор контейнер асааж preview үзүүлэх (dockerode)
- ✅ **M2** — олон файлтай төсөл (tar/putArchive, static сервер)
- ✅ **M2.5** — жинхэнэ Next.js апп (node_modules бэлэн template image)
- ✅ **API түлхүүр** — Bearer auth + оролтын хязгаар
- ✅ **Landing сайт** — Railway дээр амьд

## Бүтэц

```
sand/
├── README.md              ← энэ файл
├── docs/
│   ├── master-plan.md     ← урт хугацааны бүрэн төлөвлөгөө
│   ├── architecture.md    ← "тусдаа API үйлчилгээ" шийдвэр
│   ├── progress.md        ← явцын тэмдэглэл (өдөр бүр)
│   └── week-1-docker.md   ← Өдөр 1–7: Docker сурах гарын авлага
├── controller/            ← sandbox цөм: API + dockerode (README дотор нь)
├── template/              ← Next.js template image (Dockerfile)
└── landing/               ← танилцуулга сайт (Railway дээр амьд)
```

## Хаанаас эхлэх вэ

- Ажиллуулах: [`controller/README.md`](controller/README.md)
- Явцын байдал: [`docs/progress.md`](docs/progress.md)
- Docker сурах: [`docs/week-1-docker.md`](docs/week-1-docker.md)
- Бүрэн зураг: [`docs/master-plan.md`](docs/master-plan.md)
