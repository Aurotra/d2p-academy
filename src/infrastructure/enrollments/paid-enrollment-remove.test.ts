import { describe, expect, it, vi } from "vitest";

import { removeEnrollmentsFromEvent } from "@/infrastructure/enrollments/remove-enrollments-from-event";

type QueryResult = { data: unknown; error: null | { message: string } };

function createRemoveClient(options: {
  enrollmentId: string;
  hasPaidPayment: boolean;
  auditInsert?: ReturnType<typeof vi.fn>;
}) {
  const auditInsert =
    options.auditInsert ?? vi.fn(async () => ({ data: null, error: null } satisfies QueryResult));

  const paymentsSelectChain = {
    in: vi.fn(() => ({
      eq: vi.fn(async () =>
        ({
          data: options.hasPaidPayment
            ? [{ enrollment_id: options.enrollmentId }]
            : [],
          error: null,
        }) satisfies QueryResult,
      ),
    })),
  };

  const enrollmentsSelectChain = {
    in: vi.fn(async () =>
      ({
        data: [
          {
            id: options.enrollmentId,
            status: "registered",
            user_id: "stu-1",
            event_id: "evt-1",
            student_code: null,
            profiles: { full_name: "Öğrenci", email: "o@example.com" },
            events: { title: "Etkinlik" },
            certificates: [],
          },
        ],
        error: null,
      }) satisfies QueryResult,
    ),
  };

  const enrollmentsDeleteChain = {
    in: vi.fn(() => ({
      select: vi.fn(async () =>
        ({
          data: [{ id: options.enrollmentId }],
          error: null,
        }) satisfies QueryResult,
      ),
    })),
  };

  const from = vi.fn((table: string) => {
    if (table === "enrollments") {
      return {
        select: vi.fn(() => enrollmentsSelectChain),
        delete: vi.fn(() => enrollmentsDeleteChain),
      };
    }
    if (table === "payments") {
      return {
        select: vi.fn(() => paymentsSelectChain),
      };
    }
    if (table === "admin_audit_logs") {
      return {
        insert: auditInsert,
      };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return { client: { from } as never, auditInsert };
}

describe("removeEnrollmentsFromEvent paid payment warning", () => {
  it("returns payment_not_refunded warning and audits had_paid_payment when paid", async () => {
    const enrollmentId = "enr-paid-1";
    const { client, auditInsert } = createRemoveClient({
      enrollmentId,
      hasPaidPayment: true,
    });

    const result = await removeEnrollmentsFromEvent(client, {
      enrollmentIds: [enrollmentId],
      actorId: "admin-1",
      actorEmail: "admin@example.com",
      reason: "etkinlik iptal",
    });

    expect(result.removed).toBe(1);
    expect(result.paymentWarning).toEqual({
      warning: "payment_not_refunded",
      message:
        "Bu kayıt ücretliydi, iptal edilirken ödeme otomatik iade edilmedi — manuel iade gerekebilir.",
      paidEnrollmentIds: [enrollmentId],
    });

    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "enrollment_deleted",
        enrollment_id: enrollmentId,
        metadata: expect.objectContaining({
          had_paid_payment: true,
          payment_not_refunded: true,
          warning: "payment_not_refunded",
        }),
      }),
    );
  });

  it("does not warn when there is no paid payment", async () => {
    const enrollmentId = "enr-free-1";
    const { client, auditInsert } = createRemoveClient({
      enrollmentId,
      hasPaidPayment: false,
    });

    const result = await removeEnrollmentsFromEvent(client, {
      enrollmentIds: [enrollmentId],
      actorId: "admin-1",
      actorEmail: "admin@example.com",
      reason: null,
    });

    expect(result.paymentWarning).toBeNull();
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          had_paid_payment: false,
        }),
      }),
    );
    expect(auditInsert.mock.calls[0]?.[0]?.metadata?.payment_not_refunded).toBeUndefined();
  });
});
