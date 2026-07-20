import { NextResponse } from "next/server";

import type { SurveyDimensionsInput } from "@/core/domain/participant-forms";
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

    const body = (await request.json()) as {
      skip?: boolean;
      survey?: SurveyDimensionsInput | null;
    };

    const repository = new SupabaseParticipantFormsRepository(actor.client);
    const data = await repository.submitPreTest(
      enrollmentId,
      actor.actorId,
      body.skip ? null : (body.survey ?? null),
    );

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ön test kaydedilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
