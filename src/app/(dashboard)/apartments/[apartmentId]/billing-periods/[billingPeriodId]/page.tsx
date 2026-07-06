import { BillingPeriodDetailPage } from "@/features/billing/pages/BillingPeriodDetailPage";

// static export (double-dynamic route): สร้าง HTML shell 1 ใบด้วย placeholder
// client อ่าน apartmentId/billingPeriodId จริงจาก URL (useParams) ตอน render
export function generateStaticParams() {
  return [{ apartmentId: "_", billingPeriodId: "_" }];
}

export default function Page() {
  return <BillingPeriodDetailPage />;
}
