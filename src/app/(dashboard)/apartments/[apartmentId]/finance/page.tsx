import { FinancePage } from "@/features/finance/pages/FinancePage";

export default function Page() {
  return <FinancePage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
