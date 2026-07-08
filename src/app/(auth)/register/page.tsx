"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { getApiErrorMessage } from "@/lib/format";
import { useT, type TranslateFn } from "@/i18n";

const makeSchema = (t: TranslateFn) =>
  z
    .object({
      firstNameTH: z.string().optional(),
      lastNameTH: z.string().optional(),
      email: z.string().email(t("email-invalid")),
      phone: z
        .string()
        .min(9, t("phone-invalid"))
        .max(15, t("phone-invalid")),
      password: z.string().min(6, t("password-min-6")),
      confirmPassword: z.string().min(1, t("confirm-password-required")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwords-not-matching"),
      path: ["confirmPassword"],
    });

type FormValues = {
  firstNameTH?: string;
  lastNameTH?: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const register = useAuthStore((s) => s.register);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: {
      firstNameTH: "",
      lastNameTH: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await register({
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        phone: values.phone,
        firstNameTH: values.firstNameTH || undefined,
        lastNameTH: values.lastNameTH || undefined,
      });
      toast.success(t("register-success"));
      router.replace("/login");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title={t("register")} subtitle={t("register-subtitle")}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstNameTH"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("first-name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("first-name")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastNameTH"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("last-name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("last-name")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input placeholder="0812345678" {...field} />
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
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("confirm-password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("register")}
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-gray-600">
            {t("already-have-account")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary-hover"
            >
              {t("login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
