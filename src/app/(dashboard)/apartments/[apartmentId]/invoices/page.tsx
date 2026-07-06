import { InvoicesPage } from "@/features/invoice/pages/InvoicesPage";

export default function Page() {
  return <InvoicesPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
