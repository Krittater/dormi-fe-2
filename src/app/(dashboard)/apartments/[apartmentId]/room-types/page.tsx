import { RoomTypesPage } from "@/features/room-type/pages/RoomTypesPage";

export default function Page() {
  return <RoomTypesPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
