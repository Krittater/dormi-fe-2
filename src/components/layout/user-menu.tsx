"use client";

import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth.store";
import { getApiErrorMessage, getInitials } from "@/lib/format";
import { useT } from "@/i18n";

export function UserMenu() {
  const router = useRouter();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const displayName =
    [user?.firstNameTH, user?.lastNameTH].filter(Boolean).join(" ") ||
    user?.email ||
    t("user");

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t("logged-out"));
      router.replace("/login");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate font-medium">{displayName}</span>
          {user?.email && (
            <span className="truncate text-xs font-normal text-gray-500">
              {user.email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <UserIcon className="h-4 w-4" />
          <span>{t("my-apartments")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
