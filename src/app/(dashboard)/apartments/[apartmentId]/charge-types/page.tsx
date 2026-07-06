import { ChargeTypesPage } from "@/features/charge-type/pages/ChargeTypesPage";

export default function Page() {
  return <ChargeTypesPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
