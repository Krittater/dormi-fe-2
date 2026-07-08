# Dormi Frontend

หน้าบ้านของระบบจัดการหอพัก Dormi — **Next.js 16** (App Router) + React 19 + Tailwind v4 + shadcn/ui
รันบน production เป็น **Node server** (`output: 'standalone'`) ใน Docker หลัง edge (reverse proxy)

```
ผู้ใช้ → https://dormi-linkandrent.com → edge (TLS/LB) → dormi-web:3000 (container นี้)
                                                          └→ เรียก API ที่ https://dormi-api.dormi-linkandrent.com
```

---

## รันบนเครื่องตัวเอง (dev)

```bash
npm install
npm run dev        # เปิด http://localhost:3000
```

> ต้องรัน backend ด้วย (repo `dormi-backend-V2` → `npm run start:dev` ที่ port 7654)
> dev ชี้ API ตาม `NEXT_PUBLIC_API_URL` (ไม่ตั้ง = `http://localhost:7654`)

---

## 🚀 Deploy ขึ้น Production (ทีละขั้น — ทำตามได้เลย)

> **หลักการสำคัญ:** ห้ามแก้โค้ดบน server เด็ดขาด — แก้ที่เครื่องเรา → push ขึ้น GitHub → ไป pull + build บน server
>
> สัญลักษณ์: 💻 = ทำที่เครื่องเรา · 🖥️ = ทำบน server (ssh เข้าไปก่อน)

### สิ่งที่ต้องมีก่อน (ทำครั้งเดียว)

1. **Backend + Edge ต้อง deploy แล้ว** (ดู README ของ `dormi-backend-V2` และ `dormi-edge`)
2. **DNS**: `dormi-linkandrent.com` (A record `@`) ชี้ไปที่ IP ของ server (ตั้งที่ Namecheap)
3. **cert ครอบ apex แล้ว** (ออกจากฝั่ง edge ด้วย `scripts/issue-cert.sh`)
4. ไฟล์ **`.env.production`** ที่เครื่องเรา (ไฟล์นี้ **ไม่อยู่ใน git**) เนื้อหา:
   ```
   NEXT_PUBLIC_API_URL=https://dormi-api.dormi-linkandrent.com
   ```

### ขั้นตอน deploy

**1) 💻 push โค้ดล่าสุดขึ้น GitHub**

```bash
git push origin main
```

**2) 💻 ssh เข้า server**

```bash
ssh -i C:\Users\Anuchit\.ssh\id_ed25519 root@188.166.228.210
```

**3) 🖥️ clone (ครั้งแรก) หรือ pull (ครั้งถัดไป)**

```bash
# ครั้งแรก
cd ~ && git clone https://github.com/Krittater/dormi-fe-2.git

# ครั้งถัดไป
cd ~/dormi-fe-2 && git pull origin main
```

**4) 💻 ส่งไฟล์ env ขึ้น server (ครั้งแรก หรือเมื่อค่าเปลี่ยน)**

`.env.production` ถูก gitignore (ไม่ไปกับ git) ต้อง scp เอง:

```bash
scp -i C:\Users\Anuchit\.ssh\id_ed25519 "C:\Users\Anuchit\Desktop\Private\dormi\dormi-fronend\.env.production" root@188.166.228.210:/root/dormi-fe-2/.env.production
```

**5) 🖥️ build + รัน**

```bash
cd ~/dormi-fe-2
docker compose up -d --build
```

รอ build เสร็จ (~2-4 นาที) — container ชื่อ `dormi-fe-2-dormi-web-1` จะรันบน network `dormi_network`
(ไม่เปิด port ออก internet — เข้าผ่าน edge เท่านั้น)

**6) 🖥️ ตรวจว่าขึ้นจริง**

```bash
docker ps | grep dormi-web                    # ต้องเห็น Up
docker logs dormi-fe-2-dormi-web-1 | tail -3  # ต้องเห็น "Ready"
```

**7) 💻 ตรวจจาก internet (จากเครื่องเราหรือมือถือ)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://dormi-linkandrent.com/login   # ต้องได้ 200 หรือ 308
```

หรือเปิดเบราว์เซอร์ → `https://dormi-linkandrent.com` → ต้องเห็นหน้า login ไม่มี cert เตือน

### เมื่อมีการแก้โค้ด (deploy รอบถัดไป)

**แบบอัตโนมัติ (แนะนำ)** — push ขึ้น `main` แล้ว GitHub Actions deploy ให้เอง:

```
💻 แก้โค้ด → git commit → git push origin main
```

workflow: `.github/workflows/deploy-production.yml` → SSH เข้า server → รัน `/root/dormi-edge/deploy/dormi-frontend/deploy.sh`

**GitHub Secrets** (ตั้งครั้งเดียวที่ repo นี้ — Settings → Secrets and variables → Actions → environment `production`):

| Secret | ค่า |
|--------|-----|
| `SERVER_USER` | `root` |
| `PROD_SERVER` | IP ของ server (เช่น `188.166.228.210`) |
| `SSH_KEY` | เนื้อหา private key (`~/.ssh/id_ed25519`) |

**แบบมือ** (ถ้าไม่ใช้ CI):

```
💻 แก้โค้ด → git commit → git push origin main
🖥️ cd ~/dormi-fe-2 && git pull origin main && docker compose up -d --build
```

---

## ⚠️ เรื่องที่ต้องรู้ / ปัญหาที่เคยเจอ

| เรื่อง | รายละเอียด |
|-------|-----------|
| **API URL ถูก bake ตอน build** | เปลี่ยน API URL = แก้ `.env.production` แล้ว build ใหม่ (`--build`) ไม่ใช่แค่ restart |
| **`npm ci` fail บน server**: `Missing: @emnapi/...` | `package-lock.json` ไม่ sync — แก้ที่เครื่องเรา: `npm install --package-lock-only` → commit lock → push → pull/build ใหม่ |
| **CORS ผิด domain** | backend ตั้ง `CORS_ORIGIN=https://dormi-linkandrent.com` (apex) — ถ้าเสิร์ฟหน้าบ้านที่ domain อื่น (เช่น www) จะเรียก API ไม่ได้ ต้องแก้ CORS ฝั่ง backend ด้วย |
| **auth เป็น client-side** | ไม่มี middleware ฝั่ง server — โดน 401 จาก API เมื่อไหร่ interceptor เด้งไป `/login` เอง |
| **scale** | `docker compose up -d --scale dormi-web=2` — edge กระจาย load ให้อัตโนมัติ |

---

## โครงโปรเจค (ย่อ)

```
src/
├─ app/            # Next.js routes (page.tsx = wrapper บางๆ)
├─ features/<domain>/pages/   # หน้า UI จริงต่อ domain (client components)
├─ api/            # axios instance + interceptors (401 → /login)
├─ services/       # เรียก API ต่อ domain
├─ queries/ hooks/ # TanStack React Query
├─ schemas/        # zod validation
└─ i18n/           # ข้อความ th/en/cn (messages.json + useT())
```

เอกสาร deploy ละเอียดเพิ่มเติม: [DEPLOY.md](DEPLOY.md)
