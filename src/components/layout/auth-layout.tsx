"use client";

import { Building2 } from "lucide-react";

import { useT } from "@/i18n";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const t = useT();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Dormi
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {t("all-in-one-dormitory-system")}
        </p>
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
