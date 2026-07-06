import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // static export → สร้างโฟลเดอร์ out/ (HTML/CSS/JS ล้วน) สำหรับ host หน้าบ้าน
  output: "export",
  // static host: ไม่มี image optimizer → ต้อง unoptimized
  images: { unoptimized: true },
  // แต่ละ route ออกเป็น <route>/index.html → host static ง่าย (nginx try_files)
  trailingSlash: true,
};

export default nextConfig;
