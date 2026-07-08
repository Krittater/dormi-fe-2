"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/layout/auth-layout";
import { useAuthStore } from "@/stores/auth.store";
import { useApartmentStore } from "@/stores/apartment.store";
import { getApiErrorMessage } from "@/lib/format";
import { useT, type TranslateFn } from "@/i18n";

const makeSchema = (t: TranslateFn) =>
  z.object({
    email: z.string().email(t("email-invalid")),
    password: z.string().min(1, t("password-required")),
  });

type FormValues = { email: string; password: string };

function PasswordField({
  field,
}: {
  field: React.ComponentProps<typeof Input>;
}) {
  const t = useT();
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center">
      <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
      <Input
        {...field}
        type={show ? "text" : "password"}
        placeholder="••••••••"
        autoComplete="current-password"
        className="pl-10 pr-10"
      />
      <button
        type="button"
        aria-label={show ? t("hide-password") : t("show-password")}
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 text-gray-400 transition-colors hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const t = useT();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const fetchApartments = useApartmentStore((s) => s.fetchApartments);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await login(values);
      await fetchApartments().catch(() => undefined);
      toast.success(t("login-success"));
      const redirect = searchParams.get("redirect");
      router.replace(
        redirect && redirect.startsWith("/") ? redirect : "/dashboard"
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title={t("welcome-back")} subtitle={t("login-to-continue")}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <PasswordField field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {submitting ? t("logging-in") : t("login")}
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-gray-600">
            {t("no-account-yet")}{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:text-primary-hover"
            >
              {t("register")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
