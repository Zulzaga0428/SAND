# Kodu Sandbox — Next.js template image
# node_modules-ийг УРЬДЧИЛАН суулгасан image. Preview болгонд npm install
# хийхгүй — контейнер асмагц шууд `next dev` ажиллана. Хурдны гол нууц.
#
# Build:  docker build -t kodu-template-next .

FROM node:20-alpine

WORKDIR /home/node/app

# npm registry-г build-arg-аар солих боломжтой (удаан сүлжээнд mirror ашиглана):
#   docker build --build-arg NPM_REGISTRY=https://registry.npmmirror.com -t kodu-template-next .
ARG NPM_REGISTRY=https://registry.npmjs.org

# Эхлээд зөвхөн package.json хуулж install хийнэ — Docker layer cache
# ашиглахын тулд (код өөрчлөгдөхөд дахин install хийхгүй).
# Удаан сүлжээнд зориулж timeout/retry-г өсгөсөн.
COPY package.json ./
RUN npm install --no-audit --no-fund \
      --registry=$NPM_REGISTRY \
      --fetch-timeout=600000 \
      --fetch-retries=5 \
      --fetch-retry-maxtimeout=120000 \
      --maxsockets=5 \
    && chown -R node:node /home/node/app

# Суурь төслийн файлууд
COPY --chown=node:node . .

# 🔒 root биш хэрэглэгчээр ажиллана
USER node

EXPOSE 3000
CMD ["npm", "run", "dev"]
