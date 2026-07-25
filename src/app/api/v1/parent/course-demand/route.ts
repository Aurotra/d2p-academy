import { NextResponse } from "next/server";

import { listCourseDemandsForClient } from "@/infrastructure/course-demand/course-demand-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function GET() {
  const client = await createSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: auth } = await client.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  try {
    const entries = await listCourseDemandsForClient(client);
    return NextResponse.json({ data: { entries } });
  } catch (error) {
    console.error("[parent course-demand GET]", error);
    return NextResponse.json({ error: "Talepler alınamadı." }, { status: 500 });
  }
}
