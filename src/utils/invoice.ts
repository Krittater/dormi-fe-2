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

  const result = {
    ...merged,
    items,
    totalAmount: Number(merged.totalAmount ?? 0),
    total: Number(merged.total ?? merged.totalAmount ?? 0),
  } as Invoice;

  // #region agent log
  fetch('http://127.0.0.1:7741/ingest/3c08e7e7-ae2a-40d7-b163-da40d14b7a35',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'237d3a'},body:JSON.stringify({sessionId:'237d3a',runId:'pre-fix',hypothesisId:'A,C',location:'invoice.ts:mergeInvoiceDetail',message:'merged invoice field presence',data:{hasId:!!result.id,hasIssueDate:!!result.issueDate,hasIssuedDate:!!(result as Record<string,unknown>).issuedDate,issueDate:result.issueDate??null,issuedDate:(result as Record<string,unknown>).issuedDate??null,roomName:result.roomName??null,tenantName:result.tenantName??null,itemsLen:items.length,item0:{name:items[0]?.name??null,description:items[0]?.description??null,itemType:items[0]?.itemType??null,amount:items[0]?.amount??null},total:result.total,totalAmount:result.totalAmount},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return result;
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
