import { NextResponse } from "next/server";

import { resolveEnrollmentActorForEnrollment } from "@/infrastructure/auth/resolve-enrollment-actor";
import { SupabaseParticipantFormsRepository } from "@/infrastructure/repositories/supabase-participant-forms-repository";
import { apiCatchResponse } from "@/shared/utils/api-error";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: enrollmentId } = await context.params;
    const actor = await resolveEnrollmentActorForEnrollment(enrollmentId);
    if (!actor.ok) {
      return actor.response;
    }

    const repository = new SupabaseParticipantFormsRepository(actor.client);
    const data = await repository.getWizardState(enrollmentId, actor.actorId);

    return NextResponse.json({ data });
  } catch (error) {
    return apiCatchResponse(error, "Form durumu alınamadı.", {
      logLabel: "[enrollments/forms]",
      status: 400,
    });
  }
}
