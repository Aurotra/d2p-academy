import { NextResponse } from "next/server";

import { getEventCapacityBlockReason } from "@/infrastructure/enrollments/event-capacity";
import { logMemberActivity } from "@/infrastructure/audit/log-member-activity";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { getEventEnrollmentBlockReason } from "@/shared/utils/event-enrollment-window";
import { isStudentParticipantProfile } from "@/shared/utils/student-participant-profile";
import { apiCatchResponse, logSupabaseError } from "@/shared/utils/api-error";

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

    const { data: actorProfile } = await client
      .from("profiles")
      .select("role, username")
      .eq("id", user.id)
      .maybeSingle();

    if (!actorProfile || !isStudentParticipantProfile(actorProfile)) {
      return NextResponse.json(
        {
          error:
            "Veli hesabı doğrudan etkinliğe kaydolamaz. Çocuk hesapları sayfasından çocuğunuzu kaydedin.",
        },
        { status: 400 },
      );
    }

    const { data: event, error: eventError } = await client
      .from("events")
      .select("id, title, status, end_at, is_paid, price_try_cents")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
    }

    if (Boolean(event.is_paid) && (event.price_try_cents ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Bu ücretli bir etkinlik. Kayıt ve ödeme veli paneli üzerinden çocuğunuz için yapılmalıdır.",
        },
        { status: 400 },
      );
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
        const { data: duplicate } = await client
          .from("enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("event_id", eventId)
          .maybeSingle();

        return NextResponse.json({
          data: {
            enrollmentId: duplicate?.id,
            alreadyEnrolled: true,
            eventTitle: event.title,
          },
        });
      }

      logSupabaseError("[enrollments POST]", insertError);
      return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 400 });
    }

    const { data: profile } = await client
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    void logMemberActivity({
      action: "enrollment_created",
      actorId: user.id,
      actorEmail: profile?.email ?? user.email ?? null,
      actorName: profile?.full_name ?? null,
      studentId: user.id,
      studentName: profile?.full_name ?? null,
      eventId: event.id,
      eventTitle: event.title,
      enrollmentId: enrollment.id,
    });

    return NextResponse.json({
      data: {
        enrollmentId: enrollment.id,
        alreadyEnrolled: false,
        eventTitle: event.title,
      },
    });
  } catch (error) {
    return apiCatchResponse(error, "Kayıt sırasında hata oluştu.", {
      logLabel: "[enrollments POST]",
      status: 500,
    });
  }
}
