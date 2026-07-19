import { NextResponse } from "next/server";

import type { IntakeFormInput } from "@/core/domain/participant-forms";
import { resolveEnrollmentActor } from "@/infrastructure/auth/resolve-enrollment-actor";
import { SupabaseParticipantFormsRepository } from "@/infrastructure/repositories/supabase-participant-forms-repository";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: enrollmentId } = await context.params;
    const actor = await resolveEnrollmentActor();
    if (!actor.ok) {
      return actor.response;
    }

    const body = (await request.json()) as IntakeFormInput;
    const repository = new SupabaseParticipantFormsRepository(actor.client);
    await repository.submitIntake(enrollmentId, actor.actorId, body);

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tanıma formu kaydedilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
