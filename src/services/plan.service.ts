import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";

/**
 * แผน + โควตาของบัญชีที่ login อยู่ (GET /auth/me/plan)
 * ใช้เพื่อ UX เท่านั้น (โชว์โควตา/ซ่อนเมนู) — backend เป็นผู้บังคับจริง
 */
export interface MyPlan {
  plan: {
    code: string;
    name: string;
    priceMonthly: string | null;
    priceYearly: string | null;
    currency: string;
  } | null;
  /** 'subscription' = มีแพ็กเกจจริง · 'default' = ยังไม่ได้ assign (ตกแผนเริ่มต้น) · 'none' = ระบบยังไม่ seed แผน */
  source: "subscription" | "default" | "none";
  /** null = ยังไม่บังคับสิทธิ์ตามแผน (enforce ปิด) → โชว์ทุกเมนู */
  features: string[] | null;
  limits: {
    /** null = ไม่จำกัด */
    room_limit: number | null;
  };
  usage: {
    rooms: number;
  };
}

export const planService = {
  async myPlan(): Promise<MyPlan> {
    return http.get<MyPlan>(endpoints.auth.myPlan());
  },
};
