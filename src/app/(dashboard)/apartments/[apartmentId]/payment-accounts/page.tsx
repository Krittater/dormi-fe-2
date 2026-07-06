import { PaymentAccountsPage } from "@/features/payment-account/pages/PaymentAccountsPage";

export default function Page() {
  return <PaymentAccountsPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
