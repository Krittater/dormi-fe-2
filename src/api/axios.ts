import axios from "axios";

import { setupAuthInterceptor } from "./auth.interceptor";
import { setupResponseInterceptor } from "./response.interceptor";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7654";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

setupAuthInterceptor(axiosInstance);
setupResponseInterceptor(axiosInstance);

export const http = {
  get: <T>(path: string) =>
    axiosInstance.get<T>(path).then((response) => response.data),
  post: <T>(path: string, body?: unknown) =>
    axiosInstance.post<T>(path, body).then((response) => response.data),
  patch: <T>(path: string, body?: unknown) =>
    axiosInstance.patch<T>(path, body).then((response) => response.data),
  put: <T>(path: string, body?: unknown) =>
    axiosInstance.put<T>(path, body).then((response) => response.data),
  delete: <T>(path: string, body?: unknown) =>
    axiosInstance.delete<T>(path, { data: body }).then((response) => response.data),
};
