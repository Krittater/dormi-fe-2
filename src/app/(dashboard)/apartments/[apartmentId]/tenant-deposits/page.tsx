import { TenantDepositsPage } from "@/features/tenant-deposit/pages/TenantDepositsPage";

export default function Page() {
  return <TenantDepositsPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
