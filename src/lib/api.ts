export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7654";

export class ApiError extends Error {
  code: number;
  data: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.data = data;
  }
}

interface StandardApiResponse<T> {
  code: number;
  success: boolean;
  data: T | null;
  message: string;
}

type QueryValue = string | number | boolean | undefined | null;

export function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  let payload: StandardApiResponse<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text) as StandardApiResponse<T>;
    } catch {
      payload = null;
    }
  }

  if (!res.ok || (payload && payload.success === false)) {
    const message =
      payload?.message || `เกิดข้อผิดพลาด (${res.status})`;
    throw new ApiError(message, payload?.code ?? res.status, payload?.data);
  }

  return (payload?.data ?? null) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
};
