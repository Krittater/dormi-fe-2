# ── Build: static export → out/ ──
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# NEXT_PUBLIC_API_URL ถูก bake ตอน build (มาจาก .env.production) —
# override ได้ด้วย: docker build --build-arg NEXT_PUBLIC_API_URL=...
ARG NEXT_PUBLIC_API_URL
RUN npm run build

# ── Runtime: nginx เสิร์ฟไฟล์ static ──
FROM nginx:1.28-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
