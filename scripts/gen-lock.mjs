// สร้าง package-lock.json ใหม่ "แบบ Linux" ให้ตรงกับ image ที่ Docker build ใช้
// ─────────────────────────────────────────────────────────────────────────
// ทำไมต้องมี: npm บน Windows ชอบตัด optional/bundled deps ของ Linux ออกจาก lock
//   (เช่น @emnapi/* ที่ @tailwindcss/oxide-wasm32-wasi ต้องใช้) → พอ server รัน
//   `npm ci` บน node:22-alpine (Linux) จะหาไม่เจอ → build พัง
// วิธีแก้: ให้ container Linux เป็นคน gen lock → มีของครบตรงกับตอน deploy
//
// ใช้งาน:  npm run lockfile   แล้วค่อย git add package-lock.json && commit && push
// ต้องมี:  Docker เปิดอยู่

import { execSync } from 'node:child_process';

// process.cwd() ให้ absolute path ของทุก OS; แปลง \ → / ให้ docker บน Windows อ่านได้
const dir = process.cwd().replace(/\\/g, '/');
const image = 'node:22-alpine';

const cmd = `docker run --rm -v "${dir}:/app" -w /app ${image} npm install --package-lock-only`;

console.log('🐧 gen package-lock.json แบบ Linux ผ่าน', image);
console.log('   ', cmd, '\n');

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log(
    '\n✅ เสร็จแล้ว — ตรวจ diff แล้ว git add package-lock.json && commit && push ได้เลย',
  );
} catch (err) {
  console.error(
    '\n❌ gen lock ล้มเหลว — เช็คว่า Docker เปิดอยู่หรือยัง (Docker Desktop running?)',
  );
  process.exit(err?.status ?? 1);
}
