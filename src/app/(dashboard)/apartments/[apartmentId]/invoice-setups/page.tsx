import { InvoiceSetupsPage } from "@/features/invoice-setup/pages/InvoiceSetupsPage";

export default function Page() {
  return <InvoiceSetupsPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
