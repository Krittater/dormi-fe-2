import { MetersPage } from "@/features/meter/pages/MetersPage";

export default function Page() {
  return <MetersPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
