import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import {
  isKaklikCampaignEnabled,
  setKaklikCampaignEnabled,
} from "@/infrastructure/settings/site-settings";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function GET() {
  const client = await createSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Bağlantı kurulamadı." }, { status: 500 });
  }

  const enabled = await isKaklikCampaignEnabled(client);
  return NextResponse.json({ data: { enabled } });
}

export async function PATCH(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as { enabled?: unknown };
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled alanı true/false olmalıdır." }, { status: 400 });
    }

    const {
      data: { user },
    } = await access.client.auth.getUser();

    await setKaklikCampaignEnabled(access.client, body.enabled, user?.id ?? null);

    return NextResponse.json({ data: { enabled: body.enabled } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kampanya durumu güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
