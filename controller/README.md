# controller/

Kodu Sandbox-ийн **цөм** энд орно — Node + [`dockerode`] ашиглан
container-уудыг кодоор асаах / унтраах / устгах логик.

> Одоогоор **хоосон**. Энэ нь Build Roadmap-ийн **M1** (2-р сар) дээр эхэлнэ:
> "Кодоор нэг container асааж preview харуулах."

Түүнээс өмнө [`../docs/week-1-docker.md`](../docs/week-1-docker.md)-аар Docker-ыг
гараараа сур. Ойлголтгүйгээр код бичихгүй.

## Ирээдүйн бүтэц (M1 үед)

```
controller/
├── package.json
├── src/
│   ├── index.ts        ← HTTP controller (Express)
│   ├── sandbox.ts      ← dockerode: container lifecycle
│   └── preview.ts      ← port → Preview URL
└── ...
```

[`dockerode`]: https://github.com/apocas/dockerode
