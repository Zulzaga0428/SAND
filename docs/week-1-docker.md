# ✅ Эхний 7 хоног — Docker-ыг гараараа сурах

> "Юунаас эхлэхээ мэдэхгүй" гэсэн айдсыг арилгах хэсэг. Яг эндээс эхэл.
> Өдөрт **2 цаг**. Яарахгүй. Ойлгоогүй бол AI-аар дахин тайлбарлуул.

**Дүрэм:** Команд бүрийг гараараа бич, гарсан үр дүнг **Claude Code / Codex**-т
"энэ юу гэсэн үг вэ?" гэж асуу. Хуулж тавихгүй — **ойлгож** байж дараагийнх руу оч.

---

## 📥 Бэлтгэл (Өдөр 1-ээс өмнө)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) суулга (Mac/Windows)
- Terminal (Mac) эсвэл PowerShell (Windows) нээж сур
- Суусны дараа шалга: `docker --version` → хувилбар гарч ирвэл болоо

---

## Өдөр 1 — Docker асаж байгааг батал
```bash
docker run hello-world
```
- Юу гарч ирснийг AI-т асуу.
- **Image vs Container** ялгааг ойлго: *image* = жор, *container* = жороор хийсэн хоол.

✅ **Өнөөдрийн ялалт:** `hello-world` ажиллаж, image/container ялгааг үгээр тайлбарлаж чадвал болоо.

---

## Өдөр 2 — Ubuntu container дотор ор
```bash
docker run -it ubuntu bash
```
- Одоо чи жижиг Ubuntu **дотор** байна. Дотор нь тойр:
```bash
ls
pwd
cd /
ls
exit
```
✅ **Ялалт:** container дотор орж, тойрч, `exit`-ээр гарч чадвал болоо.

---

## Өдөр 3 — Container / image жагсааж, устгаж сур
```bash
docker ps            # ажиллаж буй container
docker ps -a         # бүх container (унтарсныг ч)
docker images        # татсан image-ууд
docker rm <id>       # container устгах
docker rmi <id>      # image устгах
```
✅ **Ялалт:** хуучин container-уудаа жагсааж, устгаж цэвэрлэж чадвал болоо.

---

## Өдөр 4 — Node-ыг Ubuntu container дотор суулга
```bash
docker run -it ubuntu bash
# container дотор:
apt update && apt install -y nodejs npm
node -v
npm -v
```
✅ **Ялалт:** container дотор `node -v` хувилбар харуулбал болоо.

---

## Өдөр 5 — Container дотор жижиг код ажиллуул
```bash
# container дотор:
mkdir app && cd app
echo 'console.log("сайн уу, Sandbox")' > index.js
node index.js
```
✅ **Ялалт:** `сайн уу, Sandbox` гэж хэвлэгдвэл болоо. **Чи container дотор код ажиллууллаа!**

---

## Өдөр 6 — Dockerfile гэж юу вэ
- `Dockerfile` = container-аа хэрхэн угсрахыг бичсэн **жор**.
- Claude Code-оор жижиг жишээ бичүүлж, ойлго:
```dockerfile
FROM node:20
WORKDIR /app
COPY . .
CMD ["node", "index.js"]
```
```bash
docker build -t myapp .
docker run myapp
```
✅ **Ялалт:** өөрийн Dockerfile-аар image build хийж, ажиллуулж чадвал болоо.

---

## Өдөр 7 — Давталт ба амралт
- Өдөр 1–6-г дахин нэг гүйлгэ. Ойлгоогүй зүйлээ AI-аар тайлбарлуул.
- Юу ойлгосноо энэ файлын доор 2–3 өгүүлбэрээр бич (өөртөө тэмдэглэл).
- **Амар.** Шахахгүй.

---

## 🎯 7 хоногийн эцэст
Docker container **асааж, дотор нь орж, устгаж, жижиг код ажиллуулж** чадна.
→ **Sandbox замын эхний алхам хийгдсэн.** Дараа нь Өдөр 8-аас Next.js-ийг Docker
дотор ажиллуулах руу орно (master-plan-ий 4-р долоо хоног).

---

### 📝 Миний тэмдэглэл (энд бич)
<!-- Өдөр бүр юу ойлгосноо энд нэмж бич -->
- Өдөр 1:
- Өдөр 2:
- Өдөр 3:
- Өдөр 4:
- Өдөр 5:
- Өдөр 6:
- Өдөр 7:
