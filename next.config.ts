import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // รันเป็น Node server (next start) — dynamic route + RSC ทำงานครบทุก param
  // standalone = bundle server.js + deps ที่จำเป็น → docker image เล็ก
  output: "standalone",
};

export default nextConfig;
