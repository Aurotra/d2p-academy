import { NextResponse } from "next/server";

import type { IntakeFormInput } from "@/core/domain/participant-forms";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseParticipantFormsRepository } from "@/infrastructure/repositories/supabase-participant-forms-repository";

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

    const body = (await request.json()) as IntakeFormInput;
    const repository = new SupabaseParticipantFormsRepository(client);
    await repository.submitIntake(enrollmentId, user.id, body);

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tanıma formu kaydedilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
