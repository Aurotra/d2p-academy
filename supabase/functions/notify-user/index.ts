import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

import {
  buildDocumentEmail,
  buildGradeEmail,
  buildRegistrationAdminEmail,
  sendResendEmail,
} from "./email-templates.ts";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function handleGradeNotification(
  supabaseAdmin: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
): Promise<{ sent: number }> {
  const studentId = String(record.student_id ?? "");
  const documentId = String(record.document_id ?? "");
  const score = Number(record.score ?? 0);
  const feedback = record.feedback ? String(record.feedback) : null;

  if (!studentId) {
    throw new Error("grades kaydında student_id bulunamadı.");
  }

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
    studentId,
  );

  if (authError || !authUser.user?.email) {
    throw new Error(authError?.message ?? "Öğrenci e-postası alınamadı.");
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", studentId)
    .single();

  const { data: document } = await supabaseAdmin
    .from("documents")
    .select("title")
    .eq("id", documentId)
    .single();

  const email = buildGradeEmail({
    studentName: profile?.full_name ?? "Öğrenci",
    documentTitle: document?.title ?? "Ödev",
    score,
    feedback,
  });

  await sendResendEmail({
    to: authUser.user.email,
    subject: email.subject,
    html: email.html,
  });

  return { sent: 1 };
}

async function handleDocumentNotification(
  supabaseAdmin: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
): Promise<{ sent: number }> {
  const documentTitle = String(record.title ?? "Yeni Döküman");

  const { data: students, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "student")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Öğrenci listesi alınamadı: ${error.message}`);
  }

  let sent = 0;

  for (const student of students ?? []) {
    if (!student.email) {
      continue;
    }

    const email = buildDocumentEmail({
      studentName: student.full_name ?? "Öğrenci",
      documentTitle,
    });

    await sendResendEmail({
      to: student.email,
      subject: email.subject,
      html: email.html,
    });

    sent += 1;
  }

  return { sent };
}

async function handleRegistrationNotification(
  record: Record<string, unknown>,
): Promise<{ sent: number }> {
  const adminEmail = Deno.env.get("ADMIN_EMAIL");

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL tanımlı değil.");
  }

  const email = buildRegistrationAdminEmail({
    fullName: String(record.full_name ?? "—"),
    phone: String(record.phone ?? "—"),
    grade: String(record.grade ?? "—"),
    course: String(record.course ?? "—"),
    createdAt: String(record.created_at ?? new Date().toISOString()),
  });

  await sendResendEmail({
    to: adminEmail,
    subject: email.subject,
    html: email.html,
  });

  return { sent: 1 };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  const incomingSecret = request.headers.get("x-webhook-secret");

  if (!webhookSecret || incomingSecret !== webhookSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = (await request.json()) as WebhookPayload;
    const supabaseAdmin = getSupabaseAdmin();

    if (payload.table === "grades" && (payload.type === "INSERT" || payload.type === "UPDATE")) {
      const result = await handleGradeNotification(supabaseAdmin, payload.record);
      return jsonResponse({ ok: true, table: "grades", ...result });
    }

    if (payload.table === "documents" && payload.type === "INSERT") {
      const result = await handleDocumentNotification(supabaseAdmin, payload.record);
      return jsonResponse({ ok: true, table: "documents", ...result });
    }

    if (payload.table === "registrations" && payload.type === "INSERT") {
      const result = await handleRegistrationNotification(payload.record);
      return jsonResponse({ ok: true, table: "registrations", ...result });
    }

    return jsonResponse({
      ok: true,
      skipped: true,
      reason: "Bu tablo veya olay için bildirim tanımlı değil.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return jsonResponse({ error: message }, 500);
  }
});
