import { BillingPeriodsPage } from "@/features/billing/pages/BillingPeriodsPage";

export default function Page() {
  return <BillingPeriodsPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
