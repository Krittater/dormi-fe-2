import { RoomChargesPage } from "@/features/room-charge/pages/RoomChargesPage";

export default function Page() {
  return <RoomChargesPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
