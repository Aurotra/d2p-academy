import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseParticipantFormsRepository } from "@/infrastructure/repositories/supabase-participant-forms-repository";

export async function GET(
  _request: Request,
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

    const repository = new SupabaseParticipantFormsRepository(client);
    const data = await repository.getWizardState(enrollmentId, user.id);

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Form durumu alınamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
