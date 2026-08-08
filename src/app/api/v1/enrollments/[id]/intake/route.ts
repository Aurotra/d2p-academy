import { NextResponse } from "next/server";

import type { IntakeFormInput } from "@/core/domain/participant-forms";
import { logMemberActivity } from "@/infrastructure/audit/log-member-activity";
import { resolveEnrollmentActorForEnrollment } from "@/infrastructure/auth/resolve-enrollment-actor";
import { SupabaseParticipantFormsRepository } from "@/infrastructure/repositories/supabase-participant-forms-repository";
import { apiCatchResponse } from "@/shared/utils/api-error";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: enrollmentId } = await context.params;
    const actor = await resolveEnrollmentActorForEnrollment(enrollmentId);
    if (!actor.ok) {
      return actor.response;
    }

    const body = (await request.json()) as IntakeFormInput;
    const repository = new SupabaseParticipantFormsRepository(actor.client);
    await repository.submitIntake(enrollmentId, actor.actorId, body);

    const { data: enrollment } = await actor.client
      .from("enrollments")
      .select("id, user_id, event_id, events(title)")
      .eq("id", enrollmentId)
      .maybeSingle();

    const { data: student } = enrollment?.user_id
      ? await actor.client
          .from("profiles")
          .select("full_name, email, parent_id")
          .eq("id", enrollment.user_id)
          .maybeSingle()
      : { data: null };

    const eventTitle =
      enrollment?.events &&
      typeof enrollment.events === "object" &&
      "title" in enrollment.events &&
      typeof enrollment.events.title === "string"
        ? enrollment.events.title
        : null;

    void logMemberActivity({
      action: "intake_form_submitted",
      actorId: actor.actorId,
      studentId: enrollment?.user_id ?? null,
      studentName: student?.full_name ?? null,
      studentEmail: student?.email ?? null,
      eventId: enrollment?.event_id ?? null,
      eventTitle,
      enrollmentId,
      metadata: {
        submitted_by_parent: actor.actorId !== enrollment?.user_id,
      },
    });

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return apiCatchResponse(error, "Tanıma formu kaydedilemedi.", {
      logLabel: "[enrollments/intake]",
      status: 400,
    });
  }
}
