FROM node:20-alpine
WORKDIR /home/node/app

# Удаан сүлжээнд mirror ашиглах боломж (Next.js template-тэй ижил):
#   docker build --build-arg NPM_REGISTRY=https://registry.npmmirror.com -t kodu-template-expo .
ARG NPM_REGISTRY=https://registry.npmjs.org

# node_modules-ийг УРЬДЧИЛАН суулгана — preview болгонд npm install хийхгүй.
# --legacy-peer-deps: react-native-svg зэрэг нь "react-native" (жинхэнэ) багцыг
# peer гэж шаарддаг ч бид react-native-web ашигладаг тул peer зөрчлийг үл тоомсорлоно.
COPY package.json ./
RUN npm install --no-audit --no-fund --legacy-peer-deps \
      --registry=$NPM_REGISTRY \
      --fetch-timeout=600000 \
      --fetch-retries=5 \
      --fetch-retry-maxtimeout=120000 \
      --maxsockets=5 \
    && chown -R node:node /home/node/app

# Суурь төслийн файлууд (хэрэглэгчийн App.tsx src/App.tsx-ийг дарж бичнэ)
COPY . .
RUN chown -R node:node /home/node/app

USER node
EXPOSE 3000
CMD ["npm", "run", "dev"]
