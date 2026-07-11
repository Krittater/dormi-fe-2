// GET /version — บอก commit ที่ deploy อยู่ (ใช้โดย snapshot/health-check ตอน full-update)
// force-dynamic = รันตอน request จริง → อ่าน env APP_VERSION ที่ deploy.sh ส่งเข้ามาตอน runtime
// (ไม่ prerender ตอน build เพราะ standalone เป็น Node server อ่าน env runtime ได้)
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    service: "frontend",
    version: process.env.APP_VERSION ?? "unknown",
    builtAt: process.env.BUILT_AT ?? null,
  });
}
