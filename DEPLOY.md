# Deploy — Dormi Frontend (Static Export)

หน้าบ้าน build เป็น **static export** (`output: 'export'`) → ได้โฟลเดอร์ `out/` (HTML/CSS/JS ล้วน)
เอาไป host บน static server ไหนก็ได้ (nginx, S3, Vercel, Netlify ฯลฯ)

---

## เตรียมก่อน deploy

1. **Node.js 22+** (ตรงกับ Dockerfile) + npm
2. **API ต้อง live ก่อน** — หน้าบ้านเรียก `NEXT_PUBLIC_API_URL` ที่ตั้งใน [`.env.production`](.env.production)
   ปัจจุบัน: `https://dormi-api.dormi-linkandrent.com`
3. **ฝั่ง backend ต้องตั้ง CORS ให้ตรง domain หน้าบ้าน**
   - `CORS_ORIGIN` = domain ที่ host หน้าบ้าน (ตอนนี้ `https://dormi-linkandrent.com`)
   - หน้าบ้าน + API ควรเป็น subdomain ของ domain เดียวกัน (same-site) เพื่อให้ cookie session ส่งได้

---

## วิธี build ให้ได้ `out/`

```bash
npm install        # ครั้งแรก / เมื่อ dependency เปลี่ยน
npm run build      # → สร้างโฟลเดอร์ out/
```

- `next build` (โหมด production) อ่าน `.env.production` ให้เอง → **API URL ถูก bake เข้า bundle ตอน build** (ไม่ใช่ runtime)
- override API URL ชั่วคราว:
  ```bash
  NEXT_PUBLIC_API_URL=https://api-อื่น.com npm run build
  ```
- **แก้โค้ด/เปลี่ยน API URL แล้วต้อง `npm run build` ใหม่เสมอ** (static ไม่ใช่ runtime)

---

## host ตัว `out/`

### ทางเลือก A — Docker (แนะนำ, เข้าชุดกับ backend/edge)

มี [`Dockerfile`](Dockerfile) + [`nginx.conf`](nginx.conf) ให้แล้ว (build static + เสิร์ฟด้วย nginx):

```bash
docker build -t dormi-web .
docker run -d --name dormi-web -p 8080:80 dormi-web   # ทดสอบ: http://localhost:8080
```

**ขึ้น prod (หลัง edge):** รันบน network เดียวกับ edge แล้วให้ edge proxy มา
```bash
docker run -d --name dormi-web --network dormi_network --restart always dormi-web
```
แล้วเปิด vhost ใน `dormi-edge` (มี `nginx/projects/_web-frontend.conf.example` รออยู่) —
ปรับ `server_name` = `dormi-linkandrent.com` และ upstream = `dormi-web:80`

### ทางเลือก B — เสิร์ฟ `out/` ตรงๆ ด้วย nginx

เอาไฟล์ใน `out/` ไปวางที่ web root แล้วใช้ config แบบ [`nginx.conf`](nginx.conf)
(สำคัญ: ต้องมี rewrite ของ dynamic route — ดูหัวข้อล่าง)

### ทางเลือก C — Render (ที่ใช้ host จริงตอนนี้)

Render static site: `buildCommand: npm ci && npm run build`, publish path `out`
**สำคัญ: ต้องเพิ่ม Rewrite Rules** ไม่งั้น deep-link/refresh หน้า `/apartments/<id>` จะ **404**
(nginx.conf ใช้กับ Render ไม่ได้ — Render มี config ของตัวเอง)

**เพิ่มใน Render dashboard → Settings → Redirects/Rewrites** (เรียงตามนี้ บนลงล่าง):

| Source | Destination | Action |
|--------|-------------|--------|
| `/apartments/:aid/invoices/:iid` | `/apartments/_/invoices/_/index.html` | Rewrite |
| `/apartments/:aid/billing-periods/:bid` | `/apartments/_/billing-periods/_/index.html` | Rewrite |
| `/apartments/:aid/:page` | `/apartments/_/:page/index.html` | Rewrite |
| `/apartments/:aid` | `/apartments/_/index.html` | Rewrite |

> ลำดับสำคัญ: nested (2 param) ต้องมาก่อน single · `:page` ส่งชื่อ subpage ผ่านไป shell เดียวกัน
> หรือถ้า deploy แบบ Blueprint ใช้ [`render.yaml`](render.yaml) ที่มี routes เหล่านี้ให้แล้ว
> ⚠️ Cloudflare อยู่หน้า Render — หลังแก้ rewrite อาจต้อง **purge cache** ใน Cloudflare ด้วย

---

## ⚠️ สิ่งสำคัญที่ต้องเข้าใจ

### 1) Dynamic route ใช้ "placeholder shell"
route ที่มี id (เช่น `/apartments/[apartmentId]/meters`) ถูก build เป็น shell ที่ path `_`
(`out/apartments/_/meters/index.html`) แล้ว **client อ่าน id จริงจาก URL** (`useParams`) ตอน render

→ host **ต้อง rewrite** path ที่มี id จริงให้ชี้ shell `_`:
```nginx
rewrite ^/apartments/[^/]+/invoices/[^/]+/?$        /apartments/_/invoices/_/index.html last;
rewrite ^/apartments/[^/]+/billing-periods/[^/]+/?$ /apartments/_/billing-periods/_/index.html last;
rewrite ^/apartments/[^/]+/([^/]+)/?$               /apartments/_/$1/index.html last;
rewrite ^/apartments/[^/]+/?$                        /apartments/_/index.html last;
```
(ใส่ไว้ใน `nginx.conf` ให้แล้ว — ถ้าไม่ทำ refresh/deep-link หน้า detail จะ 404 แต่การกดเข้าจากในแอปทำงานปกติ)

### 2) Auth เป็น client-side
static export ไม่มี middleware ฝั่ง server แล้ว — ถ้าเข้า `/dashboard` โดยไม่ login
จะเห็น shell แวบนึงก่อนโดน 401 เด้งไป `/login` (พฤติกรรม SPA ปกติ)

### 3) ต้อง host ที่ domain ที่ตรงกับ CORS
host หน้าบ้านที่ `https://dormi-linkandrent.com` เท่านั้น (ให้ตรง `CORS_ORIGIN` + same-site cookie)
ถ้าจะรองรับ `www.` ด้วย ต้องแก้ backend ให้ CORS รับหลาย origin

---

## checklist ก่อน go-live หน้าบ้าน

- [ ] `.env.production` → `NEXT_PUBLIC_API_URL` ชี้ API prod ที่ถูก
- [ ] backend `CORS_ORIGIN` = domain หน้าบ้าน
- [ ] DNS: `dormi-linkandrent.com` → IP server
- [ ] `npm run build` ผ่าน → มี `out/`
- [ ] host `out/` (Docker หรือ nginx) + rewrite dynamic route
- [ ] edge vhost apex → dormi-web + ออก cert เพิ่มให้ domain หน้าบ้าน
