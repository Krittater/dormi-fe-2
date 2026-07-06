import { TenantsPage } from "@/features/tenant/pages/TenantsPage";

export default function Page() {
  return <TenantsPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
