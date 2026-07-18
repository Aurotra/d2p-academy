import { NextResponse } from "next/server";

import type { ConsentFormType, MediaPermissions } from "@/core/domain/participant-forms";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
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
    const client = await createSupabaseServerClient();

    if (!client) {
      return NextResponse.json({ error: "Supabase yapılandırması bulunamadı." }, { status: 500 });
    }

    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const body = (await request.json()) as ConsentsBody;
    const repository = new SupabaseParticipantFormsRepository(client);

    await repository.submitConsents(
      enrollmentId,
      user.id,
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

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onaylar kaydedilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
