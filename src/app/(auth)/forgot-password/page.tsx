"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { AuthLayout } from "@/components/layout/auth-layout";
import { useT } from "@/i18n";

export default function ForgotPasswordPage() {
  const t = useT();

  return (
    <AuthLayout title={t("forgot-password")}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-gray-600">
            {t("forgot-password-unavailable")}
          </p>
          <Link
            href="/login"
            className="inline-block text-sm font-medium text-primary hover:text-primary-hover"
          >
            {t("back-to-login")}
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
