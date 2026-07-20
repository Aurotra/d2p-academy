import { NextResponse } from "next/server";

import type { SubmitPostTestInput } from "@/core/domain/participant-forms";
import { resolveEnrollmentActorForEnrollment } from "@/infrastructure/auth/resolve-enrollment-actor";
import { SupabaseParticipantFormsRepository } from "@/infrastructure/repositories/supabase-participant-forms-repository";

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

    const body = (await request.json()) as SubmitPostTestInput;
    const repository = new SupabaseParticipantFormsRepository(actor.client);
    await repository.submitPostTest(enrollmentId, actor.actorId, body);

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Son test kaydedilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
