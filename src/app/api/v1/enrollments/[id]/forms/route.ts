import { NextResponse } from "next/server";

import { resolveEnrollmentActor } from "@/infrastructure/auth/resolve-enrollment-actor";
import { SupabaseParticipantFormsRepository } from "@/infrastructure/repositories/supabase-participant-forms-repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: enrollmentId } = await context.params;
    const actor = await resolveEnrollmentActor();
    if (!actor.ok) {
      return actor.response;
    }

    const repository = new SupabaseParticipantFormsRepository(actor.client);
    const data = await repository.getWizardState(enrollmentId, actor.actorId);

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Form durumu alınamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
