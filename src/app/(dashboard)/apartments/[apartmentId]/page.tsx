import { ApartmentOverviewPage } from "@/features/apartment/pages/ApartmentOverviewPage";

export default function Page() {
  return <ApartmentOverviewPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
