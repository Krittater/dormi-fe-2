# Deploy — Dormi Frontend (Node server)

หน้าบ้านรันเป็น **Next.js Node server** (`output: 'standalone'`) บน DO server เดียวกับ backend/edge
→ dynamic route + RSC ทำงานครบทุก param (ไม่มีปัญหา `.txt`/placeholder แบบ static export)

edge proxy `dormi-linkandrent.com` → `dormi-web:3000` (เหมือน api)

---

## เตรียมก่อน deploy

1. **API ต้อง live** — หน้าบ้านเรียก `NEXT_PUBLIC_API_URL` ใน [`.env.production`](.env.production)
   (`https://dormi-api.dormi-linkandrent.com`) — ถูก **bake ตอน build**
2. **backend CORS** — `CORS_ORIGIN=https://dormi-linkandrent.com` (ตรงกับ domain หน้าบ้าน)
3. **DNS** — `dormi-linkandrent.com` (apex `@`) → IP ของ DO server (`188.166.228.210`)
   (ย้ายจาก Render — เปลี่ยน A record ที่ Namecheap)

---

## build ในเครื่อง (ตรวจก่อน)

```bash
npm install
npm run build      # → .next/standalone/server.js (Node server)
```
ทดสอบรัน local:
```bash
node .next/standalone/server.js    # เปิด http://localhost:3000
```

---

## deploy บน DO server (Docker)

```bash
# บน server (หลัง git pull โค้ดล่าสุด)
docker network create dormi_network        # ถ้ายังไม่มี
cd dormi-fronend
docker compose up -d --build               # build + รัน dormi-web:3000 บน dormi_network
```

- `dormi-web` **ไม่ publish port** ออก host — เข้าผ่าน edge เท่านั้น
- scale ได้: `docker compose up -d --scale dormi-web=2` (edge กระจาย load เอง)

### เปิด edge ให้ proxy มาที่หน้าบ้าน

ใน `dormi-edge/nginx/projects/` มี `_web-frontend.conf.example` — เปิดใช้:
```bash
# rename เป็น .conf + ตั้ง server_name = dormi-linkandrent.com, upstream = dormi-web:3000
cp _web-frontend.conf.example 30-web.conf   # แล้วแก้ค่าให้ตรง
docker exec dormi-edge nginx -t && docker exec dormi-edge nginx -s reload
```
แล้วออก cert เพิ่มให้ apex:
```bash
cd ~/dormi-edge && sh scripts/issue-cert.sh   # รวม dormi-linkandrent.com เข้า cert
```

---

## ⚠️ สิ่งที่ต้องรู้

- **API URL bake ตอน build** — เปลี่ยน API = แก้ `.env.production` แล้ว `--build` ใหม่
- **auth เป็น client-side** — 401 จาก API → interceptor เด้งไป `/login`
- **RAM** — droplet 2GB ควรมี swap กัน OOM (Next Node server กิน ~150-200MB)
- host ที่ `dormi-linkandrent.com` เท่านั้น (ตรง CORS + same-site cookie กับ `dormi-api.`)

---

## checklist go-live

- [ ] `.env.production` → `NEXT_PUBLIC_API_URL` ถูก
- [ ] backend `CORS_ORIGIN` = `https://dormi-linkandrent.com`
- [ ] DNS apex `@` → `188.166.228.210` (ย้ายจาก Render)
- [ ] `docker compose up -d --build` → `dormi-web` รันบน dormi_network
- [ ] edge vhost apex → `dormi-web:3000` + reload
- [ ] ออก cert รวม apex (`issue-cert.sh`)
