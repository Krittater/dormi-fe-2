// GET /dormi-release — release ที่ frontend ตัวนี้เห็น (ไม่ต้อง login)
//   release  : เลข release รวม (v0.0.x) จากไฟล์ที่ version manager เขียน
//   frontend : commit ที่ frontend รันอยู่ (env APP_VERSION)
//   history  : RELEASES.log 5 บรรทัดล่าสุด
//
// อ่านไฟล์ตอน runtime → force-dynamic (ไม่ prerender ตอน build)
// ★ ห้ามพัง: อ่านไม่เจอ = "unknown"/[] (local ไม่มีไฟล์ก็ยังตอบ 200)
//   prod: RELEASE_DIR=/dormi-releases (mount) · local: default ./.dev-release (ไฟล์ตัวอย่าง)
import { readFile } from "node:fs/promises";

export const dynamic = "force-dynamic";

const RELEASE_DIR = process.env.RELEASE_DIR ?? "./.dev-release";

async function readRelease(): Promise<string> {
  try {
    const raw = await readFile(`${RELEASE_DIR}/VERSION`, "utf8");
    return raw.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

async function readHistory(): Promise<string[]> {
  try {
    const raw = await readFile(`${RELEASE_DIR}/RELEASES.log`, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-5)
      .reverse();
  } catch {
    return [];
  }
}

export async function GET() {
  const [release, history] = await Promise.all([readRelease(), readHistory()]);
  return Response.json({
    release,
    frontend: { version: process.env.APP_VERSION ?? "unknown" },
    history,
  });
}
