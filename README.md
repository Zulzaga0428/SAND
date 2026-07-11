# 🐳 Kodu Sandbox

> Хэрэглэгчийн сайтуудыг **өөрсдийн серверт** аюулгүй ажиллуулж, preview хийх engine.
> KoDu одоо E2B (гуравдагч cloud) ашигладаг — энэ төсөл түүнийг **өөрийн Docker sandbox**-оор солино.

```
Одоо:    Kodu → E2B → Preview
Ирээдүй: Kodu → Kodu Sandbox → Preview
```

## Зарчим

**Өдөр бүр 1%. Нэг асуудал → нэг шийдэл → дараагийнх. Бид яарахгүй.**

- 🟢 E2B амьд хэрэглэгчдэд үйлчилсээр байна — эрсдэлд оруулахгүй
- 🔨 Түүний **зэрэгцээ** энд Kodu Sandbox v1-ийг эхнээс нь барина
- ✅ v1 баталгаажиж, аюулгүй болсон үед л E2B-г солино

## Энэ repo юуны тухай вэ

Энэ бол **KoDu төслөөс тусдаа**, цэвэр шинэ repo. Энд Docker дээр суурилсан
sandbox controller-ыг алхам алхмаар барина. KoDu-гийн үндсэн кодод хүрэхгүй.

## Бүтэц

```
sand/
├── README.md              ← энэ файл
├── docs/
│   ├── master-plan.md     ← урт хугацааны бүрэн төлөвлөгөө
│   └── week-1-docker.md   ← Өдөр 1–7: Docker сурах гарын авлага
└── controller/            ← ирээдүйн sandbox controller (Node + dockerode)
    └── README.md
```

## Хаанаас эхлэх вэ

👉 [`docs/week-1-docker.md`](docs/week-1-docker.md) — **Өдөр 1**-ээс эхэл.
Бүрэн зураг: [`docs/master-plan.md`](docs/master-plan.md).
