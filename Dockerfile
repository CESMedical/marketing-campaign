FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ces-portal/package.json ces-portal/package-lock.json* ./
COPY ces-portal/prisma ./prisma/

RUN npm ci

COPY ces-portal/ .

RUN npm run build

CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-3000}"]
