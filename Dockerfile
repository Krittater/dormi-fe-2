# ── Build ──
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# NEXT_PUBLIC_API_URL ถูก bake ตอน build จาก .env.production (อยู่ใน context แล้ว)
# เปลี่ยน API URL = แก้ .env.production
RUN npm run build

# ── Runtime: standalone Node server ──
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

# standalone bundle (server.js + node_modules ที่จำเป็น) + static + public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
