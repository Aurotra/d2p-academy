import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CapacityFullError,
  tryReserveCapacityAndEnroll,
} from "@/infrastructure/enrollments/try-reserve-capacity-and-enroll";
import {
  requiresIyzicoCheckout,
  resolveEventPaymentMode,
} from "@/infrastructure/events/event-payment-mode";
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
  const { data: existing } = await serviceClient
    .from("enrollments")
    .select("id")
    .eq("user_id", parentUserId)
    .eq("event_id", eventId)
    .neq("status", "cancelled")
    .maybeSingle();

  if (!existing?.id) {
    return;
  }

  // Do not silently cancel a paid seat — refund flow is not implemented yet.
  const { data: paid } = await serviceClient
    .from("payments")
    .select("id")
    .eq("enrollment_id", existing.id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (paid) {
    console.warn(
      "[parent enroll] skipped cancelling parent self-enrollment with paid payment",
      { enrollmentId: existing.id, eventId, parentUserId },
    );
    return;
  }

  await serviceClient
    .from("enrollments")
    .update({ status: "cancelled" })
    .eq("id", existing.id)
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
    .select("id, title, status, end_at, is_paid, payment_mode, price_try_cents")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
  }

  const enrollmentBlock = getEventEnrollmentBlockReason(event);
  if (enrollmentBlock) {
    return NextResponse.json({ error: enrollmentBlock }, { status: 400 });
  }

  const paymentMode = resolveEventPaymentMode({
    paymentMode: event.payment_mode,
    isPaid: event.is_paid,
  });
  const priceTryCents = event.price_try_cents ?? 0;

  if (requiresIyzicoCheckout(paymentMode)) {
    if (priceTryCents <= 0) {
      return NextResponse.json(
        { error: "Bu etkinlik için geçerli bir ücret tanımlı değil." },
        { status: 400 },
      );
    }

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
      if (checkoutError instanceof CapacityFullError) {
        return NextResponse.json({ error: checkoutError.message }, { status: 409 });
      }
      const message =
        checkoutError instanceof Error ? checkoutError.message : "Ödeme başlatılamadı.";
      if (message === "ALREADY_ENROLLED") {
        const { data: existing } = await serviceClient
          .from("enrollments")
          .select("id")
          .eq("user_id", studentId)
          .eq("event_id", eventId)
          .maybeSingle();
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

  try {
    const reserved = await tryReserveCapacityAndEnroll(serviceClient, {
      eventId,
      userId: studentId,
      targetStatus: "registered",
      enrollmentSource: "parent",
    });

    await cancelParentSelfEnrollment(serviceClient, auth.user.id, eventId);

    if (reserved.alreadyEnrolled) {
      return NextResponse.json({
        data: {
          enrollmentId: reserved.enrollmentId,
          alreadyEnrolled: true,
          eventTitle: event.title,
        },
      });
    }

    return NextResponse.json(
      {
        data: {
          enrollmentId: reserved.enrollmentId,
          alreadyEnrolled: false,
          eventTitle: event.title,
          studentName: child.full_name,
          revived: reserved.revived,
        },
      },
      { status: reserved.revived ? 200 : 201 },
    );
  } catch (reserveError) {
    if (reserveError instanceof CapacityFullError) {
      return NextResponse.json({ error: reserveError.message }, { status: 409 });
    }
    console.error("[parent enroll reserve]", reserveError);
    return NextResponse.json(
      {
        error:
          reserveError instanceof Error ? reserveError.message : "Kayıt oluşturulamadı.",
      },
      { status: 500 },
    );
  }
}
