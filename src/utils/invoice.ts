import type { Invoice, InvoiceItem } from "@/types";

export function normalizeInvoiceItems(items: unknown[]): InvoiceItem[] {
  return (items as InvoiceItem[]).map((it) => ({
    ...it,
    quantity: Number(it.quantity ?? 1),
    unitPrice: Number(it.unitPrice ?? 0),
  }));
}

export function computeInvoiceTotal(items: InvoiceItem[]): number {
  return items.reduce(
    (sum, it) => sum + Number(it.quantity ?? 1) * Number(it.unitPrice ?? 0),
    0
  );
}

export function mergeInvoiceDetail(
  base: Invoice | null,
  detail: Record<string, unknown> | null
): Invoice | null {
  if (!base && !detail) return null;

  const merged = {
    ...(base ?? {}),
    ...(detail ?? {}),
  } as Invoice & Record<string, unknown>;

  const rawItems =
    (detail?.items as unknown[]) ??
    (detail?.invoiceItems as unknown[]) ??
    (base?.items as unknown[]) ??
    [];

  const items = normalizeInvoiceItems(rawItems);

  return {
    ...merged,
    items,
    totalAmount: Number(merged.totalAmount ?? 0),
    total: Number(merged.total ?? merged.totalAmount ?? 0),
  } as Invoice;
}

export function countInvoicesByStatus(
  invoices: Invoice[],
  status: string
): number {
  return invoices.filter((i) => i.status === status).length;
}

export function normalizeInvoice(inv: Invoice): Invoice {
  return {
    ...inv,
    total: Number(inv.totalAmount ?? inv.total ?? 0),
  };
}
