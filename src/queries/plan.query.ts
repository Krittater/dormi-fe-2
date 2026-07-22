import { queryOptions } from "@tanstack/react-query";

import { qk } from "@/queries/keys";
import { planService } from "@/services/plan.service";

export const planQueries = {
  me: () =>
    queryOptions({
      queryKey: qk.plan.me,
      queryFn: () => planService.myPlan(),
      // โควตา/สิทธิ์เปลี่ยนไม่บ่อย — ลด request ซ้ำ แต่ยังตามทันเมื่อ admin เปลี่ยนแผน
      staleTime: 30_000,
    }),
};
