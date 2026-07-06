import { TransactionCategoriesPage } from "@/features/transaction-category/pages/TransactionCategoriesPage";

export default function Page() {
  return <TransactionCategoriesPage />;
}

// static export: param มาจาก URL (useParams ฝั่ง client) → render ตอน visit (SPA)
export function generateStaticParams() {
  return [{ apartmentId: "_" }];
}
