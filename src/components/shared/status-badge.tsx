import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  BILLING_PERIOD_STATUS_CODES,
  BillingPeriodStatus,
  INVOICE_STATUS_CODES,
  InvoiceStatus,
  METER_READING_STATUS_CODES,
  MeterReadingStatus,
  ROOM_STATUS_CODES,
  RoomStatus,
} from "@/types";
import { useT } from "@/i18n";

type Variant = NonNullable<BadgeProps["variant"]>;

const roomVariant: Record<RoomStatus, Variant> = {
  [RoomStatus.AVAILABLE]: "secondary",
  [RoomStatus.RENTED]: "success",
  [RoomStatus.BOOKED]: "info",
  [RoomStatus.OVERDUE]: "danger",
};

const billingVariant: Record<BillingPeriodStatus, Variant> = {
  [BillingPeriodStatus.OPEN]: "info",
  [BillingPeriodStatus.GENERATED]: "warning",
  [BillingPeriodStatus.CLOSED]: "success",
  [BillingPeriodStatus.CANCELLED]: "danger",
};

const invoiceVariant: Record<InvoiceStatus, Variant> = {
  [InvoiceStatus.DRAFT]: "secondary",
  [InvoiceStatus.UNPAID]: "warning",
  [InvoiceStatus.PAID]: "success",
  [InvoiceStatus.OVERDUE]: "danger",
  [InvoiceStatus.CANCELLED]: "outline",
};

const readingVariant: Record<MeterReadingStatus, Variant> = {
  [MeterReadingStatus.NOT_RECORDED]: "secondary",
  [MeterReadingStatus.RECORDED]: "info",
  [MeterReadingStatus.BILLED]: "success",
};

type Props =
  | { kind: "room"; value: string }
  | { kind: "billing"; value: string }
  | { kind: "invoice"; value: string }
  | { kind: "reading"; value: string };

export function StatusBadge({ kind, value }: Props) {
  const t = useT();
  let variant: Variant = "secondary";
  let label = value;

  if (kind === "room") {
    const v = value as RoomStatus;
    variant = roomVariant[v] ?? "secondary";
    label = ROOM_STATUS_CODES[v] ? t(ROOM_STATUS_CODES[v]) : value;
  } else if (kind === "billing") {
    const v = value as BillingPeriodStatus;
    variant = billingVariant[v] ?? "secondary";
    label = BILLING_PERIOD_STATUS_CODES[v]
      ? t(BILLING_PERIOD_STATUS_CODES[v])
      : value;
  } else if (kind === "invoice") {
    const v = value as InvoiceStatus;
    variant = invoiceVariant[v] ?? "secondary";
    label = INVOICE_STATUS_CODES[v] ? t(INVOICE_STATUS_CODES[v]) : value;
  } else if (kind === "reading") {
    const v = value as MeterReadingStatus;
    variant = readingVariant[v] ?? "secondary";
    label = METER_READING_STATUS_CODES[v]
      ? t(METER_READING_STATUS_CODES[v])
      : value;
  }

  return <Badge variant={variant}>{label}</Badge>;
}
