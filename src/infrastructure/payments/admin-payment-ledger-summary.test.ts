import { describe, expect, it } from "vitest";

import type { AdminPaymentLedgerRow } from "@/infrastructure/payments/admin-payment-ledger";
import {
  adminPaymentLedgerCsvFilename,
  adminPaymentsHref,
  buildAdminPaymentLedgerCsv,
  formatTryCentsForExcel,
  ledgerRowInRange,
  summarizeAdminPaymentLedger,
} from "@/infrastructure/payments/admin-payment-ledger-summary";
import { resolveAdminReportRange } from "@/infrastructure/reports/admin-report-period";

function row(
  overrides: Partial<AdminPaymentLedgerRow> &
    Pick<AdminPaymentLedgerRow, "id" | "method" | "status" | "createdAt">,
): AdminPaymentLedgerRow {
  return {
    kind: "payment",
    amountTryCents: 10000,
    studentName: "Öğrenci",
    studentEmail: null,
    parentName: "Veli",
    parentEmail: "veli@example.com",
    parentPhone: "05551112233",
    eventId: "event-1",
    eventTitle: "Honaz",
    enrollmentId: "enr-1",
    enrollmentStatus: "registered",
    provider: overrides.method === "havale" ? "havale" : "paytr",
    providerRef: "oid-1",
    paidAt: null,
    isStuck: false,
    stuckWarnedAt: null,
    ...overrides,
  };
}

const august = resolveAdminReportRange({
  preset: "custom",
  from: "2026-08-01",
  to: "2026-08-31",
});

describe("summarizeAdminPaymentLedger", () => {
  it("splits paid money by method and does not mix pending into collection", () => {
    const summary = summarizeAdminPaymentLedger([
      row({
        id: "c1",
        method: "card",
        status: "paid",
        amountTryCents: 1300,
        createdAt: "2026-08-18T13:46:00.000Z",
        paidAt: "2026-08-18T13:46:00.000Z",
      }),
      row({
        id: "h1",
        method: "havale",
        status: "paid",
        amountTryCents: 500_000,
        createdAt: "2026-08-10T10:00:00.000Z",
        paidAt: "2026-08-10T10:00:00.000Z",
      }),
      row({
        id: "k1",
        kind: "kurum_enrollment",
        method: "kurum",
        status: "paid",
        amountTryCents: 200_000,
        createdAt: "2026-08-05T08:00:00.000Z",
        paidAt: "2026-08-05T08:00:00.000Z",
      }),
      row({
        id: "p1",
        method: "card",
        status: "pending",
        amountTryCents: 1300,
        createdAt: "2026-08-18T12:00:00.000Z",
        enrollmentStatus: "pending_payment",
      }),
    ]);

    expect(summary.cardPaidTryCents).toBe(1300);
    expect(summary.havalePaidTryCents).toBe(500_000);
    expect(summary.kurumPaidTryCents).toBe(200_000);
    expect(summary.cardHavalePaidTryCents).toBe(501_300);
    expect(summary.paidRowCount).toBe(3);
    expect(summary.pendingRowCount).toBe(1);
  });

  it("counts refunds separately from collection", () => {
    const summary = summarizeAdminPaymentLedger([
      row({
        id: "r1",
        method: "card",
        status: "refunded",
        amountTryCents: 13_00,
        createdAt: "2026-08-02T10:00:00.000Z",
        paidAt: "2026-08-01T10:00:00.000Z",
      }),
    ]);
    expect(summary.cardPaidTryCents).toBe(0);
    expect(summary.refundedTryCents).toBe(1300);
    expect(summary.paidRowCount).toBe(0);
  });
});

describe("ledgerRowInRange", () => {
  it("uses paid_at for paid rows so late settlement lands in the collection month", () => {
    const paidLate = row({
      id: "late",
      method: "card",
      status: "paid",
      createdAt: "2026-07-31T20:00:00.000Z",
      paidAt: "2026-08-01T08:00:00.000Z",
    });
    expect(ledgerRowInRange(paidLate, august)).toBe(true);

    const paidPrevious = row({
      id: "prev",
      method: "card",
      status: "paid",
      createdAt: "2026-08-01T08:00:00.000Z",
      paidAt: "2026-07-31T08:00:00.000Z",
    });
    expect(ledgerRowInRange(paidPrevious, august)).toBe(false);
  });
});

describe("adminPaymentsHref", () => {
  it("omits default this-month ledger query", () => {
    expect(adminPaymentsHref({})).toBe("/admin/payments");
    expect(
      adminPaymentsHref({
        view: "ledger",
        method: "havale",
        status: "paid",
        period: "last_3_months",
      }),
    ).toBe("/admin/payments?method=havale&status=paid&period=last_3_months");
  });
});

describe("ledger csv", () => {
  it("writes a semicolon workbook Excel can open, with period totals above rows", () => {
    expect(formatTryCentsForExcel(501_300)).toBe("5013,00");
    expect(adminPaymentLedgerCsvFilename(august)).toBe("d2p-odemeler-2026-08-01_2026-08-31.csv");

    const csv = buildAdminPaymentLedgerCsv({
      rangeLabel: august.label,
      summary: summarizeAdminPaymentLedger([
        row({
          id: "c1",
          method: "card",
          status: "paid",
          amountTryCents: 1300,
          createdAt: "2026-08-18T13:46:00.000Z",
          paidAt: "2026-08-18T13:46:00.000Z",
          studentName: 'Falcon "Y"',
        }),
      ]),
      rows: [
        row({
          id: "c1",
          method: "card",
          status: "paid",
          amountTryCents: 1300,
          createdAt: "2026-08-18T13:46:00.000Z",
          paidAt: "2026-08-18T13:46:00.000Z",
          studentName: 'Falcon "Y"',
        }),
      ],
    });

    expect(csv).toContain("Kart tahsilat (₺);13,00");
    expect(csv).toContain("Kart + havale (₺);13,00");
    expect(csv).toContain('"Falcon ""Y"""');
    expect(csv).toContain("Kart");
    expect(csv).toContain("Ödendi");
  });
});
