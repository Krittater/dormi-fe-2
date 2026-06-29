import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

/**
 * Cookie-based auth uses `withCredentials: true` on the axios instance.
 * This interceptor is a seam for future bearer-token auth if needed.
 */
export function setupAuthInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => config,
    (error) => Promise.reject(error)
  );
}
