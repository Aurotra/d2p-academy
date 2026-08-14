import { describe, expect, it, vi } from "vitest";

import { softCancelEnrollmentsWithRefundGuard } from "@/infrastructure/enrollments/soft-cancel-enrollments-with-refund-guard";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/repositories/supabase-admin-audit-log-repository";

type QueryResult = { data: unknown; error: null | { message: string; code?: string } };

describe("softCancelEnrollmentsWithRefundGuard", () => {
  it("opens refund_followups before soft-cancelling a paid enrollment", async () => {
    const enrollmentId = "enr-1";
    const refundInsert = vi.fn(async () => ({ data: null, error: null } satisfies QueryResult));

    const enrollmentsSelectIn = vi.fn(async () =>
      ({
        data: [{ id: enrollmentId, user_id: "stu-1", event_id: "evt-1", status: "registered" }],
        error: null,
      }) satisfies QueryResult,
    );

    const enrollmentsUpdate = {
      in: vi.fn(() => ({
        select: vi.fn(async () =>
          ({
            data: [
              {
                id: enrollmentId,
                status: "cancelled",
                completed_at: null,
                event_id: "evt-1",
              },
            ],
            error: null,
          }) satisfies QueryResult,
        ),
      })),
    };

    const paymentsSelect = {
      in: vi.fn(() => ({
        eq: vi.fn(async () =>
          ({
            data: [
              {
                id: "pay-1",
                enrollment_id: enrollmentId,
                amount_try_cents: 9900,
                currency: "TRY",
                provider: "iyzico",
                status: "paid",
                provider_payment_id: "iy-55",
                provider_conversation_id: null,
                paid_at: "2026-08-01T10:00:00.000Z",
                created_at: "2026-08-01T09:00:00.000Z",
              },
            ],
            error: null,
          }) satisfies QueryResult,
        ),
      })),
    };

    const client = {
      from: vi.fn((table: string) => {
        if (table === "enrollments") {
          return {
            select: vi.fn(() => ({ in: enrollmentsSelectIn })),
            update: vi.fn(() => enrollmentsUpdate),
          };
        }
        if (table === "payments") {
          return { select: vi.fn(() => paymentsSelect) };
        }
        if (table === "refund_followups") {
          return { insert: refundInsert };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as never;

    const result = await softCancelEnrollmentsWithRefundGuard(client, {
      enrollmentIds: [enrollmentId],
      actorId: "admin-1",
      reason: "veli talebi",
    });

    expect(result.data[0]?.status).toBe("cancelled");
    expect(result.cancelledCount).toBe(1);
    expect(result.paidEnrollmentCount).toBe(1);
    expect(result.paymentWarning?.warning).toBe("payment_not_refunded");
    expect(refundInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        enrollment_id: enrollmentId,
        amount_try_cents: 9900,
        provider_payment_id: "iy-55",
        cancelled_by: "admin-1",
        reason: "veli talebi",
        status: "open",
      }),
    );
  });

  it("bulk soft-cancel: cancels all, queues only paid enrollments into refund_followups", async () => {
    const paidId = "enr-paid";
    const freeId = "enr-free";
    const refundInsert = vi.fn(async () => ({ data: null, error: null } satisfies QueryResult));

    const enrollmentsSelectIn = vi.fn(async () =>
      ({
        data: [
          { id: paidId, user_id: "stu-1", event_id: "evt-1", status: "registered" },
          { id: freeId, user_id: "stu-2", event_id: "evt-1", status: "registered" },
        ],
        error: null,
      }) satisfies QueryResult,
    );

    const enrollmentsUpdate = {
      in: vi.fn(() => ({
        select: vi.fn(async () =>
          ({
            data: [
              { id: paidId, status: "cancelled", completed_at: null, event_id: "evt-1" },
              { id: freeId, status: "cancelled", completed_at: null, event_id: "evt-1" },
            ],
            error: null,
          }) satisfies QueryResult,
        ),
      })),
    };

    const paymentsSelect = {
      in: vi.fn(() => ({
        eq: vi.fn(async () =>
          ({
            data: [
              {
                id: "pay-1",
                enrollment_id: paidId,
                amount_try_cents: 15000,
                currency: "TRY",
                provider: "iyzico",
                status: "paid",
                provider_payment_id: "iy-bulk-1",
                provider_conversation_id: null,
                paid_at: "2026-08-01T10:00:00.000Z",
                created_at: "2026-08-01T09:00:00.000Z",
              },
            ],
            error: null,
          }) satisfies QueryResult,
        ),
      })),
    };

    const client = {
      from: vi.fn((table: string) => {
        if (table === "enrollments") {
          return {
            select: vi.fn(() => ({ in: enrollmentsSelectIn })),
            update: vi.fn(() => enrollmentsUpdate),
          };
        }
        if (table === "payments") {
          return { select: vi.fn(() => paymentsSelect) };
        }
        if (table === "refund_followups") {
          return { insert: refundInsert };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as never;

    const result = await softCancelEnrollmentsWithRefundGuard(client, {
      enrollmentIds: [paidId, freeId],
      actorId: "admin-1",
      reason: "toplu iptal",
    });

    expect(result.cancelledCount).toBe(2);
    expect(result.data.every((row) => row.status === "cancelled")).toBe(true);
    expect(result.paidEnrollmentCount).toBe(1);
    expect(result.paymentWarning?.paidEnrollmentIds).toEqual([paidId]);
    expect(refundInsert).toHaveBeenCalledTimes(1);
    expect(refundInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        enrollment_id: paidId,
        status: "open",
      }),
    );
    expect(refundInsert).not.toHaveBeenCalledWith(
      expect.objectContaining({ enrollment_id: freeId }),
    );
  });
});

describe("logRefundFollowupResolved", () => {
  it("writes refund_followup_resolved audit with payment metadata", async () => {
    const insert = vi.fn(async () => ({ data: null, error: null } satisfies QueryResult));
    const client = {
      from: vi.fn(() => ({ insert })),
    } as never;

    const audit = new SupabaseAdminAuditLogRepository(client);
    await audit.logRefundFollowupResolved({
      actorId: "admin-1",
      actorEmail: "admin@example.com",
      reason: "iyzico panelinden iade",
      followupId: "rf-1",
      eventId: "evt-1",
      eventTitle: "Etkinlik",
      studentId: "stu-1",
      studentName: "Öğrenci",
      studentEmail: "o@example.com",
      enrollmentId: "enr-1",
      metadata: {
        status: "refunded_manual",
        amount_try_cents: 9900,
        provider: "iyzico",
        provider_payment_id: "iy-55",
      },
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "refund_followup_resolved",
        actor_id: "admin-1",
        enrollment_id: "enr-1",
        metadata: expect.objectContaining({
          refund_followup_id: "rf-1",
          status: "refunded_manual",
          provider_payment_id: "iy-55",
          amount_try_cents: 9900,
        }),
      }),
    );
  });
});
