import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";

import { translate } from "@/i18n/runtime";

import { ApiError } from "./errors";

interface StandardApiResponse<T> {
  code: number;
  success: boolean;
  data: T | null;
  message: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Backend single-resource endpoints add a redundant `{ data }` or
 * `{ message, data }` layer on top of the global `{success,data,timestamp}`
 * envelope (already stripped by the caller). List endpoints return
 * `{ data: [...], meta }`, which must be left intact for `toList()`. This
 * strips only the redundant single-resource wrapper, recursing in case of
 * further nesting (e.g. login's `{message, data: {userId}}`).
 */
function unwrapNestedData(value: unknown, depth = 0): unknown {
  if (depth > 5 || !isPlainObject(value) || !("data" in value)) return value;
  if (Array.isArray(value.data)) return value;
  const extraKeys = Object.keys(value).filter(
    (key) => key !== "data" && key !== "message"
  );
  if (extraKeys.length > 0) return value;
  return unwrapNestedData(value.data, depth + 1);
}

export function setupResponseInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response: AxiosResponse<StandardApiResponse<unknown>>) => {
      const payload = response.data;

      if (payload && typeof payload === "object" && payload.success === false) {
        return Promise.reject(
          new ApiError(payload.message, payload.code, payload.data)
        );
      }

      if (payload && typeof payload === "object" && "data" in payload) {
        response.data = unwrapNestedData(
          payload.data ?? null
        ) as typeof response.data;
      }

      return response;
    },
    (error: AxiosError<StandardApiResponse<unknown>>) => {
      const payload = error.response?.data;
      const status = error.response?.status ?? 0;
      // status 0 = ไม่มี response เลย (server ล่ม / เน็ตหลุด) — "เกิดข้อผิดพลาด (0)" สื่อสารไม่ได้
      const message =
        payload?.message ||
        (status === 0
          ? translate("network-error")
          : status === 403
            ? translate("no-permission")
            : translate("api-error-with-status", { status: String(status) }));

      // client-side auth guard (static export ไม่มี proxy/middleware ฝั่ง server แล้ว)
      // 401 = ยังไม่ login / session หมด → เด้งไปหน้า login (กัน loop ถ้าอยู่หน้า login อยู่แล้ว)
      // 403 = login แล้วแต่ไม่มีสิทธิ์ → ไม่เด้ง แค่ surface ApiError ให้หน้าจอจัดการ
      if (typeof window !== "undefined" && status === 401) {
        const { pathname, search } = window.location;
        if (!pathname.startsWith("/login")) {
          const redirect = encodeURIComponent(pathname + search);
          window.location.href = `/login?redirect=${redirect}`;
        }
      }

      return Promise.reject(
        new ApiError(message, payload?.code ?? status, payload?.data)
      );
    }
  );
}
