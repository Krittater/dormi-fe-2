import { RoomsPage } from "@/features/room/pages/RoomsPage";

export default function Page() {
  return <RoomsPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
