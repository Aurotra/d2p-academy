import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

import {
  buildDocumentEmail,
  buildGradeEmail,
  buildRegistrationAdminEmail,
  sendResendEmail,
} from "./email-templates.ts";
import {
  loadParentProfiles,
  resolveStudentRecipientEmail,
  studentDocumentsPath,
  studentReportPath,
  type StudentProfileRow,
} from "./resolve-student-notification.ts";

const SITE_URL = "https://www.d2p.com.tr";

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
): Promise<{ sent: number; skipped?: boolean; reason?: string }> {
  const studentId = String(record.student_id ?? "");
  const documentId = String(record.document_id ?? "");
  const score = Number(record.score ?? 0);
  const feedback = record.feedback ? String(record.feedback) : null;

  if (!studentId) {
    throw new Error("grades kaydında student_id bulunamadı.");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, parent_id")
    .eq("id", studentId)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Öğrenci profili alınamadı.");
  }

  const parentById = await loadParentProfiles(
    supabaseAdmin,
    profile.parent_id ? [profile.parent_id] : [],
  );

  const recipient = await resolveStudentRecipientEmail(
    supabaseAdmin,
    profile as StudentProfileRow,
    parentById,
  );

  if (!recipient) {
    return {
      sent: 0,
      skipped: true,
      reason: "Öğrenci veya veli için e-posta adresi bulunamadı.",
    };
  }

  const { data: document } = await supabaseAdmin
    .from("documents")
    .select("title")
    .eq("id", documentId)
    .single();

  const studentName = profile.full_name ?? "Öğrenci";
  const documentTitle = document?.title ?? "Ödev";

  const email = buildGradeEmail({
    recipientName: recipient.recipientName,
    studentName,
    documentTitle,
    score,
    feedback,
    reportUrl: `${SITE_URL}${studentReportPath(profile)}`,
    notifyParent: recipient.notifyParent,
  });

  await sendResendEmail({
    to: recipient.email,
    subject: email.subject,
    html: email.html,
  });

  return { sent: 1 };
}

async function handleDocumentNotification(
  supabaseAdmin: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
): Promise<{ sent: number; skipped: number }> {
  const documentTitle = String(record.title ?? "Yeni Döküman");

  const { data: students, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, parent_id")
    .eq("role", "student")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Öğrenci listesi alınamadı: ${error.message}`);
  }

  const studentRows = (students ?? []) as StudentProfileRow[];
  const parentById = await loadParentProfiles(
    supabaseAdmin,
    studentRows.map((student) => student.parent_id).filter(Boolean) as string[],
  );

  let sent = 0;
  let skipped = 0;

  for (const student of studentRows) {
    const recipient = await resolveStudentRecipientEmail(supabaseAdmin, student, parentById);
    if (!recipient) {
      skipped += 1;
      continue;
    }

    const email = buildDocumentEmail({
      recipientName: recipient.recipientName,
      studentName: student.full_name ?? "Öğrenci",
      documentTitle,
      documentsUrl: `${SITE_URL}${studentDocumentsPath(student)}`,
      notifyParent: recipient.notifyParent,
    });

    await sendResendEmail({
      to: recipient.email,
      subject: email.subject,
      html: email.html,
    });

    sent += 1;
  }

  return { sent, skipped };
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
