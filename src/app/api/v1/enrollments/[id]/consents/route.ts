import { NextResponse } from "next/server";

import type { ConsentFormType, MediaPermissions } from "@/core/domain/participant-forms";
import { resolveEnrollmentActorForEnrollment } from "@/infrastructure/auth/resolve-enrollment-actor";
import { SupabaseParticipantFormsRepository } from "@/infrastructure/repositories/supabase-participant-forms-repository";
import { getClientIp } from "@/lib/utils/request-ip";

interface ConsentsBody {
  consents?: Array<{
    formType?: ConsentFormType;
    accepted?: boolean;
    consentTextVersion?: string;
    parentSignature?: string;
    mediaPermissions?: MediaPermissions | null;
  }>;
  healthNote?: string | null;
}

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

    const body = (await request.json()) as ConsentsBody;
    const repository = new SupabaseParticipantFormsRepository(actor.client);

    const data = await repository.submitConsents(
      enrollmentId,
      actor.actorId,
      {
        consents: (body.consents ?? []).map((item) => ({
          formType: item.formType as ConsentFormType,
          accepted: Boolean(item.accepted),
          consentTextVersion: item.consentTextVersion ?? "",
          parentSignature: item.parentSignature ?? "",
          mediaPermissions: item.mediaPermissions ?? null,
        })),
        healthNote: body.healthNote,
      },
      getClientIp(request),
    );

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onaylar kaydedilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
