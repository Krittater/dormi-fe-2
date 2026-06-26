"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApartmentStore } from "@/stores/apartment.store";

export function ApartmentSwitcher() {
  const router = useRouter();
  const apartments = useApartmentStore((s) => s.apartments);
  const currentApartmentId = useApartmentStore((s) => s.currentApartmentId);
  const setCurrent = useApartmentStore((s) => s.setCurrent);

  const current = apartments.find((a) => a.id === currentApartmentId);

  const handleSelect = (id: string) => {
    setCurrent(id);
    router.push(`/apartments/${id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full max-w-[220px] justify-between sm:w-auto"
        >
          <span className="truncate">
            {current?.name ?? "เลือกหอพัก"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>หอพักของฉัน</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {apartments.length === 0 && (
          <p className="px-2 py-2 text-sm text-gray-500">ยังไม่มีหอพัก</p>
        )}
        {apartments.map((apt) => (
          <DropdownMenuItem
            key={apt.id}
            onClick={() => handleSelect(apt.id)}
            className="justify-between"
          >
            <span className="truncate">{apt.name}</span>
            {apt.id === currentApartmentId && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <Plus className="h-4 w-4" />
          <span>จัดการ / เพิ่มหอพัก</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
