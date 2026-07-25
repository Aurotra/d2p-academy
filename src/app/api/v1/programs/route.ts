import { NextRequest, NextResponse } from "next/server";

import { listPrograms } from "@/infrastructure/programs/program-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function GET(request: NextRequest) {
  const client = await createSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const activeOnly = request.nextUrl.searchParams.get("active_only") !== "false";

  try {
    const programs = await listPrograms(client, { activeOnly });
    return NextResponse.json({ data: { programs } });
  } catch (error) {
    console.error("[programs GET]", error);
    return NextResponse.json({ error: "Programlar alınamadı." }, { status: 500 });
  }
}
