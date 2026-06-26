"use client";

import { usePathname } from "next/navigation";

export function useApartmentIdFromPath(): string | null {
  const pathname = usePathname();
  const match = pathname.match(/^\/apartments\/([^/]+)/);
  return match ? match[1] : null;
}
