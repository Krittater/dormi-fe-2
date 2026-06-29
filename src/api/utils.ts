type QueryValue = string | number | boolean | undefined | null;

export function buildQuery(
  params?: Record<string, QueryValue> | object
): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}
