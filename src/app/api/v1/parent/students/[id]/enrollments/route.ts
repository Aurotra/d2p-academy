import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getEventCapacityBlockReason } from "@/infrastructure/enrollments/event-capacity";
import { startPaidEnrollmentCheckout } from "@/infrastructure/payments/start-paid-enrollment-checkout";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import {
  isProfileComplete,
  PROFILE_INCOMPLETE_SAVE_BLOCKED_MESSAGE,
  profileProgressOptions,
} from "@/lib/utils/progress";
import { getEventEnrollmentBlockReason } from "@/shared/utils/event-enrollment-window";

const schema = z.object({
  eventId: z.string().uuid(),
});

async function cancelParentSelfEnrollment(
  serviceClient: ReturnType<typeof createServiceRoleClient>,
  parentUserId: string,
  eventId: string,
) {
  await serviceClient
    .from("enrollments")
    .update({ status: "cancelled" })
    .eq("user_id", parentUserId)
    .eq("event_id", eventId)
    .neq("status", "cancelled");
}

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
    .select(
      "id, full_name, username, gender, grade_level, school_name, city_district, experience_data, interests, motivation_data, profile_avatar_url, parent_phone, parent_id",
    )
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

  if (
    !isProfileComplete(
      {
        full_name: child.full_name,
        gender: child.gender,
        grade_level: child.grade_level,
        school_name: child.school_name,
        city_district: child.city_district,
        experience_data: child.experience_data as { coding_experience?: string } | null,
        interests: child.interests,
        motivation_data: child.motivation_data as { hedef?: string; beklenti?: number } | null,
        profile_avatar_url: child.profile_avatar_url,
        parent_phone: child.parent_phone,
      },
      profileProgressOptions(child),
    )
  ) {
    return NextResponse.json(
      { error: PROFILE_INCOMPLETE_SAVE_BLOCKED_MESSAGE, code: "PROFILE_INCOMPLETE" },
      { status: 400 },
    );
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
    .select("id, title, status, end_at, is_paid, price_try_cents")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }

  const enrollmentBlock = getEventEnrollmentBlockReason(event);
  if (enrollmentBlock) {
    return NextResponse.json({ error: enrollmentBlock }, { status: 400 });
  }

  const priceTryCents = event.price_try_cents ?? 0;
  const isPaid = Boolean(event.is_paid) && priceTryCents > 0;

  const { data: existing } = await serviceClient
    .from("enrollments")
    .select("id, status")
    .eq("user_id", studentId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (
    existing &&
    existing.status !== "cancelled" &&
    existing.status !== "pending_payment"
  ) {
    await cancelParentSelfEnrollment(serviceClient, auth.user.id, eventId);

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
    console.error("[parent enroll capacity]", capacityError);
    return NextResponse.json({ error: "Kontenjan kontrolü başarısız." }, { status: 500 });
  }

  if (isPaid) {
    const { data: payer } = await serviceClient
      .from("profiles")
      .select("full_name, email, parent_phone, city_district")
      .eq("id", auth.user.id)
      .maybeSingle();

    try {
      const checkout = await startPaidEnrollmentCheckout({
        serviceClient,
        request,
        studentId,
        studentName: child.full_name,
        eventId,
        eventTitle: event.title,
        priceTryCents,
        payerUserId: auth.user.id,
        payerFullName: payer?.full_name?.trim() || "Veli",
        payerEmail: payer?.email?.trim() || auth.user.email || "veli@d2p.com.tr",
        payerPhone: payer?.parent_phone ?? child.parent_phone,
        payerCity: payer?.city_district,
      });

      await cancelParentSelfEnrollment(serviceClient, auth.user.id, eventId);

      return NextResponse.json(
        {
          data: {
            enrollmentId: checkout.enrollmentId,
            paymentId: checkout.paymentId,
            paymentPageUrl: checkout.paymentPageUrl,
            requiresPayment: true,
            alreadyEnrolled: false,
            eventTitle: checkout.eventTitle,
            amountTryCents: checkout.amountTryCents,
            studentName: child.full_name,
          },
        },
        { status: 201 },
      );
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? checkoutError.message : "Ödeme başlatılamadı.";
      if (message === "ALREADY_ENROLLED") {
        return NextResponse.json({
          data: {
            enrollmentId: existing?.id,
            alreadyEnrolled: true,
            eventTitle: event.title,
          },
        });
      }
      console.error("[parent enroll paid checkout]", message);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (existing?.status === "cancelled" || existing?.status === "pending_payment") {
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

    await cancelParentSelfEnrollment(serviceClient, auth.user.id, eventId);

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

  await cancelParentSelfEnrollment(serviceClient, auth.user.id, eventId);

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
