"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

// ─── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

type FormValues = z.infer<typeof schema>;

// ─── Icons ─────────────────────────────────────────────────────────────────────
const MailIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    className="animate-spin"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const LoginIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </svg>
);

// ─── Brand Panel (Left) ────────────────────────────────────────────────────────
const BrandPanel = () => (
  <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#0C1E4A] px-10 py-12 overflow-hidden relative">
    {/* Hex decorations */}
    <svg
      className="pointer-events-none absolute -right-14 -top-14 opacity-[0.06]"
      width="220"
      height="220"
      viewBox="0 0 220 220"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M110 10 L200 60 L200 160 L110 210 L20 160 L20 60 Z"
        stroke="#38BDF8"
        strokeWidth="2"
      />
    </svg>
    <svg
      className="pointer-events-none absolute -bottom-16 -left-16 opacity-[0.06]"
      width="240"
      height="240"
      viewBox="0 0 240 240"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M120 10 L220 70 L220 170 L120 230 L20 170 L20 70 Z"
        stroke="#1D4ED8"
        strokeWidth="2"
      />
    </svg>

    {/* Logo */}
    <div className="flex items-center gap-3 relative z-10">
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M22 3 L39 12.5 L39 31.5 L22 41 L5 31.5 L5 12.5 Z"
          fill="none"
          stroke="#1E3A8A"
          strokeWidth="2.5"
        />
        <path
          d="M22 3 L39 12.5 L39 31.5 L22 41 L5 31.5 L5 12.5 Z"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1"
          strokeDasharray="4 60"
          strokeDashoffset="-8"
        />
        <text x="9" y="29" fontSize="17" fontWeight="700" fill="#C7D2FE">
          P
        </text>
        <text x="22" y="29" fontSize="17" fontWeight="700" fill="#38BDF8">
          F
        </text>
      </svg>
      <div>
        <p className="text-[18px] font-medium tracking-wide text-white">
          PAY<span className="text-sky-400">FLOW</span>
        </p>
        <p className="mt-px text-[9px] tracking-[3px] text-[#334D7A]">
          CERTIFICATE OF PAYMENT
        </p>
      </div>
    </div>

    {/* Hero copy */}
    <div className="relative z-10">
      <p className="text-[11px] tracking-[2px] text-sky-400 mb-3 font-medium">
        ENTERPRISE PLATFORM
      </p>
      <h2 className="text-[30px] font-medium text-white leading-snug mb-3">
        Streamline your
        <br />
        payment flow
      </h2>
      <p className="text-[13px] text-slate-500 leading-relaxed max-w-[240px]">
        ระบบจัดการใบรับรองการชำระเงินสำหรับองค์กร
        <br />
        ปลอดภัย รวดเร็ว และตรวจสอบได้ทุกขั้นตอน
      </p>
    </div>

    {/* Stats + social proof */}
    <div className="relative z-10">
      <div className="flex gap-0 mb-6">
        <div className="pr-6">
          <p className="text-[20px] font-medium text-white">99.9%</p>
          <p className="text-[11px] text-slate-500">Uptime</p>
        </div>
        <div className="border-l border-[#1E3A6E] px-6">
          <p className="text-[20px] font-medium text-white">256-bit</p>
          <p className="text-[11px] text-slate-500">Encryption</p>
        </div>
        <div className="border-l border-[#1E3A6E] pl-6">
          <p className="text-[20px] font-medium text-white">ISO 27001</p>
          <p className="text-[11px] text-slate-500">Certified</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[
          { bg: "bg-[#1E3A6E]", color: "text-slate-400" },
          { bg: "bg-[#1E3A8A]", color: "text-blue-300" },
          { bg: "bg-[#1D4ED8]", color: "text-blue-200" },
        ].map((item, i) => (
          <div
            key={i}
            className={`w-7 h-7 rounded-full ${item.bg} border-2 border-[#0C1E4A] flex items-center justify-center -ml-1 first:ml-0`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={item.color}
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        ))}
        <div className="w-7 h-7 rounded-full bg-[#1E3A6E] border-2 border-[#0C1E4A] flex items-center justify-center -ml-1 text-[10px] text-slate-400 font-medium">
          +2k
        </div>
        <span className="text-[11px] text-slate-500 ml-1">
          users trust PayFlow
        </span>
      </div>
    </div>
  </div>
);

// ─── Trust Badge ───────────────────────────────────────────────────────────────
const TrustBadge = () => (
  <div className="mt-5 flex items-center gap-2">
    <span className="block h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
    <p className="text-[11px] text-slate-500 leading-relaxed">
      การเชื่อมต่อเข้ารหัส TLS 1.3&nbsp;&nbsp;·&nbsp;&nbsp;ปลอดภัยตามมาตรฐาน
      ISO 27001
    </p>
  </div>
);

// ─── Password Input ────────────────────────────────────────────────────────────
const PasswordInput = ({
  field,
}: {
  field: ControllerRenderProps<FormValues, "password">;
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3.5 text-slate-400">
        <LockIcon />
      </span>
      <input
        {...field}
        type={show ? "text" : "password"}
        placeholder="••••••••"
        autoComplete="current-password"
        className="
          h-11 w-full rounded-[10px]
          border border-slate-200 bg-slate-50
          pl-10 pr-10 text-[13px] text-slate-900
          placeholder:text-slate-400
          outline-none transition-colors duration-150
          hover:bg-white
          focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100
        "
      />
      <button
        type="button"
        aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        onClick={() => setShow((v) => !v)}
        className="absolute right-3.5 text-slate-400 transition-colors hover:text-slate-600"
      >
        {show ? <EyeClosedIcon /> : <EyeOpenIcon />}
      </button>
    </div>
  );
};

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
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const fetchApartments = useApartmentStore((s) => s.fetchApartments);
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await login(values);
      await fetchApartments().catch(() => undefined);
      toast.success("เข้าสู่ระบบสำเร็จ");
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
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white px-6 py-10 sm:px-12 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-8 self-start">
          <svg
            width="36"
            height="36"
            viewBox="0 0 44 44"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M22 3 L39 12.5 L39 31.5 L22 41 L5 31.5 L5 12.5 Z"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="2.5"
            />
            <path
              d="M22 3 L39 12.5 L39 31.5 L22 41 L5 31.5 L5 12.5 Z"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1"
              strokeDasharray="4 60"
              strokeDashoffset="-8"
            />
            <text x="9" y="29" fontSize="15" fontWeight="700" fill="#1E40AF">
              P
            </text>
            <text x="22" y="29" fontSize="15" fontWeight="700" fill="#2563EB">
              F
            </text>
          </svg>
          <div>
            <p className="text-[16px] font-medium text-[#0C1E4A] tracking-wide">
              PAY<span className="text-sky-500">FLOW</span>
            </p>
            <p className="text-[9px] tracking-[2px] text-slate-400 mt-px">
              CERTIFICATE OF PAYMENT
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Secure badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1 mb-6">
            <span className="block w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
            <span className="text-[11px] text-blue-700 font-medium">
              Secure sign in
            </span>
          </div>

          <h1 className="text-[22px] font-medium text-slate-900 mb-1">
            ยินดีต้อนรับกลับ
          </h1>
          <p className="text-[13px] text-slate-500 mb-7">
            กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
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
                    <FormLabel className="block text-[11px] font-medium tracking-wide text-slate-500">
                      อีเมลหรือชื่อผู้ใช้
                    </FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-3.5 text-slate-400">
                          <MailIcon />
                        </span>
                        <Input
                          type="email"
                          placeholder="กรอกอีเมลหรือชื่อผู้ใช้"
                          autoComplete="email"
                          className="
                            h-11 rounded-[10px]
                            border-slate-200 bg-slate-50
                            pl-10 text-[13px]
                            placeholder:text-slate-400
                            transition-colors duration-150
                            hover:bg-white
                            focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100
                          "
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
                    <FormLabel className="block text-[11px] font-medium tracking-wide text-slate-500">
                      รหัสผ่าน
                    </FormLabel>
                    <FormControl>
                      <PasswordInput field={field} />
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
                    className={`
                      flex h-4 w-4 flex-shrink-0 items-center justify-center
                      rounded border transition-colors duration-150
                      ${
                        rememberMe
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300 bg-white hover:border-blue-400"
                      }
                    `}
                  >
                    {rememberMe && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M1.5 5L4 7.5L8.5 2.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-[12px] text-slate-500">จดจำฉันไว้</span>
                </button>

                <Link
                  href="/forgot-password"
                  className="text-[12px] text-blue-600 underline transition-colors hover:text-blue-700"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="
                  flex h-11 w-full items-center justify-center gap-2
                  rounded-[10px] bg-blue-700 text-[14px] font-medium text-white
                  transition-colors duration-150
                  hover:bg-blue-800
                  disabled:cursor-not-allowed disabled:opacity-50
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                "
              >
                {submitting ? <SpinnerIcon /> : <LoginIcon />}
                {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          </Form>

          {/* Register link */}
          <p className="mt-5 text-center text-[12px] text-slate-500">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 underline hover:text-blue-700 transition-colors"
            >
              ลงทะเบียน
            </Link>
          </p>

          <TrustBadge />
        </div>
      </div>
    </div>
  );
}
