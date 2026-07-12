import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

interface EnrollRequestBody {
  eventId?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnrollRequestBody;
    const eventId = body.eventId?.trim() ?? "";

    if (!eventId) {
      return NextResponse.json({ error: "Etkinlik bilgisi eksik." }, { status: 400 });
    }

    const client = await createSupabaseServerClient();

    if (!client) {
      return NextResponse.json({ error: "Supabase yapılandırması bulunamadı." }, { status: 500 });
    }

    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Etkinliğe kayıt olmak için giriş yapmalısınız." }, { status: 401 });
    }

    const { data: event, error: eventError } = await client
      .from("events")
      .select("id, title, status, start_at")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Bu etkinlik şu anda kayda açık değil." },
        { status: 400 },
      );
    }

    if (new Date(event.start_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Bu etkinliğin tarihi geçmiş; kayıt yapılamaz." },
        { status: 400 },
      );
    }

    const { data: existing } = await client
      .from("enrollments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        data: {
          enrollmentId: existing.id,
          alreadyEnrolled: true,
          eventTitle: event.title,
        },
      });
    }

    const { data: enrollment, error: insertError } = await client
      .from("enrollments")
      .insert({
        user_id: user.id,
        event_id: eventId,
        status: "registered",
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505" || insertError.message.toLowerCase().includes("duplicate")) {
        return NextResponse.json({
          data: {
            alreadyEnrolled: true,
            eventTitle: event.title,
          },
        });
      }

      return NextResponse.json(
        { error: mapAuthErrorToTurkish(insertError.message) },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: {
        enrollmentId: enrollment.id,
        alreadyEnrolled: false,
        eventTitle: event.title,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt sırasında hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
