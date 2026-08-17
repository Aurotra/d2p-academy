import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: paymentId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: payment } = await serviceClient
    .from("payments")
    .select("id, status, enrollment_id, student_user_id, payer_user_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment || payment.payer_user_id !== auth.user.id) {
    return NextResponse.json({ error: "Ödeme bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      status: payment.status,
      enrollmentId: payment.enrollment_id,
      studentId: payment.student_user_id,
    },
  });
}
