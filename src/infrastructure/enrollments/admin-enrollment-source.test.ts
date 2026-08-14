import { describe, expect, it, vi } from "vitest";

import { tryReserveCapacityAndEnroll } from "@/infrastructure/enrollments/try-reserve-capacity-and-enroll";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/repositories/supabase-admin-audit-log-repository";

describe("admin manual enrollment source + audit", () => {
  it("passes enrollment_source=admin_manual to reserve_event_enrollment", async () => {
    const rpc = vi.fn(async () => ({
      data: {
        ok: true,
        enrollment_id: "33333333-3333-3333-3333-333333333333",
        already_enrolled: false,
        revived: false,
        status: "registered",
      },
      error: null,
    }));

    const client = { rpc } as never;

    await tryReserveCapacityAndEnroll(client, {
      eventId: "11111111-1111-1111-1111-111111111111",
      userId: "22222222-2222-2222-2222-222222222222",
      targetStatus: "registered",
      enrollmentSource: "admin_manual",
    });

    expect(rpc).toHaveBeenCalledWith("reserve_event_enrollment", {
      p_event_id: "11111111-1111-1111-1111-111111111111",
      p_user_id: "22222222-2222-2222-2222-222222222222",
      p_target_status: "registered",
      p_enrollment_source: "admin_manual",
    });
  });

  it("logEnrollmentCreated writes enrollment_created with admin_manual source", async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ insert }));
    const client = { from } as unknown as ConstructorParameters<
      typeof SupabaseAdminAuditLogRepository
    >[0];

    const audit = new SupabaseAdminAuditLogRepository(client);
    await audit.logEnrollmentCreated({
      actorId: "admin-1",
      actorEmail: "admin@example.com",
      enrollmentId: "enr-1",
      eventId: "evt-1",
      eventTitle: "Deneme Etkinlik",
      studentId: "stu-1",
      studentName: "Öğrenci",
      studentEmail: "ogrenci@example.com",
      metadata: {
        enrollment_source: "admin_manual",
        revived: false,
      },
    });

    expect(from).toHaveBeenCalledWith("admin_audit_logs");
    expect(insert).toHaveBeenCalledWith({
      action: "enrollment_created",
      actor_id: "admin-1",
      actor_email: "admin@example.com",
      reason: null,
      enrollment_id: "enr-1",
      event_id: "evt-1",
      event_title: "Deneme Etkinlik",
      student_id: "stu-1",
      student_name: "Öğrenci",
      student_email: "ogrenci@example.com",
      metadata: {
        source: "admin_manual",
        enrollment_source: "admin_manual",
        revived: false,
      },
    });
  });
});
