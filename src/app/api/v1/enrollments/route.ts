import { NextResponse } from "next/server";

import { getEventCapacityBlockReason } from "@/infrastructure/enrollments/event-capacity";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";
import { getEventEnrollmentBlockReason } from "@/shared/utils/event-enrollment-window";

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
      .select("id, title, status, end_at")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
    }

    const enrollmentBlock = getEventEnrollmentBlockReason(event);
    if (enrollmentBlock) {
      return NextResponse.json({ error: enrollmentBlock }, { status: 400 });
    }

    const capacityBlock = await getEventCapacityBlockReason(client, eventId);
    if (capacityBlock) {
      return NextResponse.json({ error: capacityBlock }, { status: 409 });
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
