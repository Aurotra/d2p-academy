import {
  ADMIN_PAYMENT_METHOD_LABELS,
  ADMIN_PAYMENT_STATUS_LABELS,
  type AdminPaymentLedgerRow,
  type AdminPaymentMethodFilter,
  type AdminPaymentStatusFilter,
  type AdminPaymentsView,
} from "@/infrastructure/payments/admin-payment-ledger";
import {
  isTimestampInRange,
  istanbulYmd,
  type AdminReportPeriodPreset,
  type AdminReportRange,
} from "@/infrastructure/reports/admin-report-period";

export type AdminPaymentLedgerSummary = {
  cardPaidTryCents: number;
  havalePaidTryCents: number;
  kurumPaidTryCents: number;
  cardHavalePaidTryCents: number;
  paidRowCount: number;
  refundedTryCents: number;
  pendingRowCount: number;
};

export const EMPTY_ADMIN_PAYMENT_LEDGER_SUMMARY: AdminPaymentLedgerSummary = {
  cardPaidTryCents: 0,
  havalePaidTryCents: 0,
  kurumPaidTryCents: 0,
  cardHavalePaidTryCents: 0,
  paidRowCount: 0,
  refundedTryCents: 0,
  pendingRowCount: 0,
};

export function ledgerRowAccountingAt(row: AdminPaymentLedgerRow): string {
  if (row.status === "paid") {
    return row.paidAt || row.createdAt;
  }
  return row.createdAt;
}

export function ledgerRowInRange(row: AdminPaymentLedgerRow, range: AdminReportRange): boolean {
  return isTimestampInRange(ledgerRowAccountingAt(row), range);
}

function cents(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Period totals ignore method/status chips — only paid money in the already period-sliced set. */
export function summarizeAdminPaymentLedger(
  periodRows: AdminPaymentLedgerRow[],
): AdminPaymentLedgerSummary {
  const summary: AdminPaymentLedgerSummary = { ...EMPTY_ADMIN_PAYMENT_LEDGER_SUMMARY };

  for (const row of periodRows) {
    if (row.status === "pending" || row.isStuck) {
      summary.pendingRowCount += 1;
    }
    if (row.status === "refunded") {
      summary.refundedTryCents += cents(row.amountTryCents);
    }
    if (row.status !== "paid") {
      continue;
    }
    summary.paidRowCount += 1;
    const amount = cents(row.amountTryCents);
    if (row.method === "card") {
      summary.cardPaidTryCents += amount;
    } else if (row.method === "havale") {
      summary.havalePaidTryCents += amount;
    } else {
      summary.kurumPaidTryCents += amount;
    }
  }

  summary.cardHavalePaidTryCents = summary.cardPaidTryCents + summary.havalePaidTryCents;
  return summary;
}

export function adminPaymentsHref(input: {
  view?: AdminPaymentsView;
  method?: AdminPaymentMethodFilter;
  status?: AdminPaymentStatusFilter;
  period?: AdminReportPeriodPreset;
  from?: string;
  to?: string;
}): string {
  const params = new URLSearchParams();
  const view = input.view ?? "ledger";
  const method = input.method ?? "all";
  const status = input.status ?? "all";
  const period = input.period ?? "this_month";

  if (view === "stuck") params.set("view", "stuck");
  if (method !== "all") params.set("method", method);
  if (status !== "all") params.set("status", status);
  if (period !== "this_month") params.set("period", period);
  if (period === "custom") {
    if (input.from) params.set("from", input.from);
    if (input.to) params.set("to", input.to);
  }

  const query = params.toString();
  return query ? `/admin/payments?${query}` : "/admin/payments";
}

export function formatTryCentsForExcel(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  return (value / 100).toFixed(2).replace(".", ",");
}

export function adminPaymentLedgerCsvFilename(range: AdminReportRange): string {
  const start = istanbulYmd(range.startInclusive);
  const last = istanbulYmd(new Date(range.endExclusive.getTime() - 1));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `d2p-odemeler-${start.year}-${pad(start.month)}-${pad(start.day)}_${last.year}-${pad(last.month)}-${pad(last.day)}.csv`;
}

function csvCell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[;"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvStatusLabel(row: AdminPaymentLedgerRow): string {
  if (row.kind === "kurum_enrollment") {
    return row.status === "pending" ? "Kurum kaydı (bekliyor)" : "Kurum kaydı";
  }
  if (row.isStuck) {
    return row.status === "failed" ? "Takılı (başarısız)" : "Takılı (bekliyor)";
  }
  return ADMIN_PAYMENT_STATUS_LABELS[row.status];
}

function formatCsvDate(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function buildAdminPaymentLedgerCsv(input: {
  rangeLabel: string;
  summary: AdminPaymentLedgerSummary;
  rows: AdminPaymentLedgerRow[];
}): string {
  const lines = [
    ["Dönem", input.rangeLabel].map(csvCell).join(";"),
    ["Kart tahsilat (₺)", formatTryCentsForExcel(input.summary.cardPaidTryCents)].join(";"),
    ["Havale tahsilat (₺)", formatTryCentsForExcel(input.summary.havalePaidTryCents)].join(";"),
    ["Kurum tahmini (₺)", formatTryCentsForExcel(input.summary.kurumPaidTryCents)].join(";"),
    ["Kart + havale (₺)", formatTryCentsForExcel(input.summary.cardHavalePaidTryCents)].join(";"),
    ["Ödenen kayıt", String(input.summary.paidRowCount)].join(";"),
    ["İade (₺)", formatTryCentsForExcel(input.summary.refundedTryCents)].join(";"),
    "",
    [
      "Öğrenci",
      "Veli",
      "Veli e-posta",
      "Veli telefon",
      "Kurs",
      "Tutar (₺)",
      "Yöntem",
      "Durum",
      "Tarih",
      "Sağlayıcı / dekont",
      "Kayıt no",
    ]
      .map(csvCell)
      .join(";"),
  ];

  for (const row of input.rows) {
    lines.push(
      [
        row.studentName,
        row.parentName,
        row.parentEmail,
        row.parentPhone,
        row.eventTitle,
        formatTryCentsForExcel(row.amountTryCents),
        ADMIN_PAYMENT_METHOD_LABELS[row.method],
        csvStatusLabel(row),
        formatCsvDate(row.paidAt ?? row.createdAt),
        row.providerRef,
        row.enrollmentId,
      ]
        .map(csvCell)
        .join(";"),
    );
  }

  return `${lines.join("\r\n")}\r\n`;
}
