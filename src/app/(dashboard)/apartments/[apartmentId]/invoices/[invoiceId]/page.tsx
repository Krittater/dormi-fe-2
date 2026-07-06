import { InvoiceDetailPage } from "@/features/invoice/pages/InvoiceDetailPage";

// static export (double-dynamic route): สร้าง HTML shell 1 ใบด้วย placeholder
// client อ่าน apartmentId/invoiceId จริงจาก URL (useParams) ตอน render
export function generateStaticParams() {
  return [{ apartmentId: "_", invoiceId: "_" }];
}

export default function Page() {
  return <InvoiceDetailPage />;
}
