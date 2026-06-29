import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";

import { translate } from "@/i18n/runtime";

import { ApiError } from "./errors";

interface StandardApiResponse<T> {
  code: number;
  success: boolean;
  data: T | null;
  message: string;
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
        response.data = (payload.data ?? null) as typeof response.data;
      }

      return response;
    },
    (error: AxiosError<StandardApiResponse<unknown>>) => {
      const payload = error.response?.data;
      const status = error.response?.status ?? 0;
      const message =
        payload?.message ||
        translate("api-error-with-status", { status: String(status) });

      return Promise.reject(
        new ApiError(message, payload?.code ?? status, payload?.data)
      );
    }
  );
}
