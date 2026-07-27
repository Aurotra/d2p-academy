import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = await createSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  try {
    const photos = await new SupabaseGalleryRepository(client).listRecentHomePhotos(10);
    return NextResponse.json(
      { data: photos },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Galeri yüklenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
