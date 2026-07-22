import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEventCapacityBlockReason } from "@/infrastructure/enrollments/event-capacity";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { getEventEnrollmentBlockReason } from "@/shared/utils/event-enrollment-window";

const schema = z.object({
  eventId: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: studentId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz etkinlik bilgisi." }, { status: 400 });
  }

  const eventId = parsed.data.eventId;

  const { data: child, error: lookupError } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("id", studentId)
    .eq("parent_id", auth.user.id)
    .eq("role", "student")
    .not("username", "is", null)
    .maybeSingle();

  if (lookupError) {
    console.error("[parent enroll lookup]", lookupError.message);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
  if (!child) {
    return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  }

  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik (service role)." },
      { status: 500 },
    );
  }

  const { data: event, error: eventError } = await serviceClient
    .from("events")
    .select("id, title, status, end_at")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }

  const enrollmentBlock = getEventEnrollmentBlockReason(event);
  if (enrollmentBlock) {
    return NextResponse.json({ error: enrollmentBlock }, { status: 400 });
  }

  const { data: existing } = await serviceClient
    .from("enrollments")
    .select("id, status")
    .eq("user_id", studentId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing && existing.status !== "cancelled") {
    return NextResponse.json({
      data: {
        enrollmentId: existing.id,
        alreadyEnrolled: true,
        eventTitle: event.title,
      },
    });
  }

  try {
    const capacityBlock = await getEventCapacityBlockReason(serviceClient, eventId);
    if (capacityBlock) {
      return NextResponse.json({ error: capacityBlock }, { status: 409 });
    }
  } catch (capacityError) {
    const message =
      capacityError instanceof Error ? capacityError.message : "Kontenjan kontrolü başarısız.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (existing?.status === "cancelled") {
    const { data: revived, error: reviveError } = await serviceClient
      .from("enrollments")
      .update({ status: "registered", completed_at: null })
      .eq("id", existing.id)
      .eq("user_id", studentId)
      .select("id")
      .single();

    if (reviveError) {
      console.error("[parent enroll revive]", reviveError.message);
      return NextResponse.json({ error: "Kayıt yenilenemedi." }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        enrollmentId: revived.id,
        alreadyEnrolled: false,
        eventTitle: event.title,
        revived: true,
      },
    });
  }

  const { data: enrollment, error: insertError } = await serviceClient
    .from("enrollments")
    .insert({
      user_id: studentId,
      event_id: eventId,
      status: "registered",
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505" || insertError.message.toLowerCase().includes("duplicate")) {
      const { data: duplicate } = await serviceClient
        .from("enrollments")
        .select("id")
        .eq("user_id", studentId)
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
    console.error("[parent enroll insert]", insertError.message);
    return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });
  }

  return NextResponse.json(
    {
      data: {
        enrollmentId: enrollment.id,
        alreadyEnrolled: false,
        eventTitle: event.title,
        studentName: child.full_name,
      },
    },
    { status: 201 },
  );
}
