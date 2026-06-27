"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth.store";
import { useApartmentStore } from "@/stores/apartment.store";
import { getApiErrorMessage } from "@/lib/format";
import { useT, type TranslateFn } from "@/i18n";

// ─── Schema ────────────────────────────────────────────────────────────────────
const makeSchema = (t: TranslateFn) =>
  z.object({
    email: z.string().email(t("email-invalid")),
    password: z.string().min(1, t("password-required")),
  });

type FormValues = { email: string; password: string };

// ─── Brand Panel (Left) ────────────────────────────────────────────────────────
const HIGHLIGHT_CODES = [
  "login-highlight-manage",
  "login-highlight-invoice",
  "login-highlight-reports",
];

const BrandPanel = () => {
  const t = useT();
  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-primary-hover px-10 py-12 lg:flex">
      {/* decorations */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-black/10" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[18px] font-semibold tracking-wide text-white">
            Dormi
          </p>
          <p className="mt-px text-[10px] tracking-[2px] text-white/60">
            {t("dormitory-management")}
          </p>
        </div>
      </div>

      {/* Hero copy */}
      <div className="relative z-10">
        <p className="mb-3 text-[11px] font-medium tracking-[2px] text-white/70">
          {t("all-in-one-dormitory-system")}
        </p>
        <h2 className="mb-3 text-[30px] font-semibold leading-snug text-white">
          {t("login-hero-title")}
        </h2>
        <p className="max-w-[260px] text-[13px] leading-relaxed text-white/70">
          {t("login-hero-subtitle")}
        </p>
      </div>

      {/* Highlights */}
      <ul className="relative z-10 space-y-3">
        {HIGHLIGHT_CODES.map((code) => (
          <li key={code} className="flex items-center gap-3">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
              <Check className="h-3 w-3 text-white" />
            </span>
            <span className="text-[13px] text-white/80">{t(code)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Password Input ────────────────────────────────────────────────────────────
function PasswordField({
  field,
}: {
  field: React.ComponentProps<typeof Input>;
}) {
  const t = useT();
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center">
      <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400" />
      <Input
        {...field}
        type={show ? "text" : "password"}
        placeholder="••••••••"
        autoComplete="current-password"
        className="h-11 pl-10 pr-10"
      />
      <button
        type="button"
        aria-label={show ? t("hide-password") : t("show-password")}
        onClick={() => setShow((v) => !v)}
        className="absolute right-3.5 text-gray-400 transition-colors hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
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
  const [rememberMe, setRememberMe] = useState(false);

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
        redirect && redirect.startsWith("/") ? redirect : "/dashboard",
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden">
      <BrandPanel />

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-white px-6 py-10 sm:px-12 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 self-start lg:hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[16px] font-semibold tracking-wide text-gray-900">
              Dormi
            </p>
            <p className="mt-px text-[9px] tracking-[2px] text-gray-400">
              {t("dormitory-management")}
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Secure badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1">
            <span className="block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            <span className="text-[11px] font-medium text-primary-hover">
              {t("secure-login")}
            </span>
          </div>

          <h1 className="mb-1 text-[22px] font-semibold text-gray-900">
            {t("welcome-back")}
          </h1>
          <p className="mb-7 text-[13px] text-gray-500">
            {t("login-to-continue")}
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3.5"
              noValidate
            >
              {/* Email field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-[12px] font-medium text-gray-700">
                      {t("email")}
                    </FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="h-11 pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              {/* Password field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-[12px] font-medium text-gray-700">
                      {t("password")}
                    </FormLabel>
                    <FormControl>
                      <PasswordField field={field} />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe((v) => !v)}
                  className="flex cursor-pointer select-none items-center gap-2"
                >
                  <div
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
                      rememberMe
                        ? "border-primary bg-primary"
                        : "border-gray-300 bg-white hover:border-primary"
                    }`}
                  >
                    {rememberMe && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-[12px] text-gray-500">
                    {t("remember-me")}
                  </span>
                </button>

                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  {t("forgot-password")}
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[14px] font-medium text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {submitting ? t("logging-in") : t("login")}
              </button>
            </form>
          </Form>

          {/* Register link */}
          <p className="mt-6 text-center text-[13px] text-gray-500">
            {t("no-account-yet")}{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:text-primary-hover"
            >
              {t("register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
