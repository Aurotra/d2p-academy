/**
 * Create placeholder auth/profile/enrollment/certificate rows for PDF codes
 * that have no user account yet. Verify works by code; later accounts can be linked.
 *
 * Usage: node --env-file=.env.local scripts/create-pending-discovery-certificates.mjs
 */
import { createClient } from "@supabase/supabase-js";

const EVENT_ID = "f3440619-84cf-40b9-9ccc-1174583b198a";
const PENDING = [
  { name: "Aylin Arabacı", code: "D2P-3DMO-26-00106", slug: "aylin-arabaci" },
  { name: "Belinay Zeynep Aksöz", code: "D2P-3DMO-26-00112", slug: "belinay-zeynep-aksoz" },
  { name: "Giray Çolak", code: "D2P-3DMO-26-00114", slug: "giray-colak" },
];

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const now = new Date().toISOString();

function placeholderEmail(slug) {
  return `pending+${slug}@certificates.d2p.local`;
}

async function ensureUser(person) {
  const email = placeholderEmail(person.slug);

  const { data: listed } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = listed?.users?.find((u) => u.email?.toLowerCase() === email);
  if (existing) {
    await sb.from("profiles").upsert(
      {
        id: existing.id,
        full_name: person.name,
        email,
        role: "student",
        is_active: true,
        updated_at: now,
      },
      { onConflict: "id" },
    );
    return existing.id;
  }

  const { data, error } = await sb.auth.admin.createUser({
    email,
    email_confirm: true,
    password: crypto.randomUUID() + "Aa1!",
    user_metadata: {
      full_name: person.name,
      pending_certificate_link: true,
      certificate_code: person.code,
    },
  });
  if (error) throw error;

  const userId = data.user.id;
  // Trigger may already insert profile; force name.
  await sb.from("profiles").upsert(
    {
      id: userId,
      full_name: person.name,
      email,
      role: "student",
      is_active: true,
      updated_at: now,
    },
    { onConflict: "id" },
  );
  return userId;
}

async function ensureEnrollment(userId, code) {
  const { data: existing } = await sb
    .from("enrollments")
    .select("id, student_code, status")
    .eq("user_id", userId)
    .eq("event_id", EVENT_ID)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from("enrollments")
      .update({
        student_code: code,
        status: "completed",
        completed_at: now,
        intake_form_completed_at: now,
        pre_test_completed_at: now,
        post_test_completed_at: now,
        post_test_unlocked_at: now,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await sb
    .from("enrollments")
    .insert({
      user_id: userId,
      event_id: EVENT_ID,
      status: "completed",
      student_code: code,
      completed_at: now,
      intake_form_completed_at: now,
      pre_test_completed_at: now,
      post_test_completed_at: now,
      post_test_unlocked_at: now,
      enrollment_source: "admin_manual",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function markAttendance(enrollmentId) {
  const { data: sessions, error } = await sb
    .from("event_sessions")
    .select("id")
    .eq("event_id", EVENT_ID);
  if (error) throw error;
  if (!sessions?.length) return 0;

  const rows = sessions.map((s) => ({
    enrollment_id: enrollmentId,
    session_id: s.id,
    status: "present",
    marked_at: now,
    updated_at: now,
  }));
  const { error: upErr } = await sb.from("enrollment_session_attendance").upsert(rows, {
    onConflict: "enrollment_id,session_id",
  });
  if (upErr) throw upErr;
  return rows.length;
}

async function ensureCertificate(userId, enrollmentId, code) {
  const { data: byCode } = await sb
    .from("certificates")
    .select("id, status")
    .eq("certificate_code", code)
    .maybeSingle();
  if (byCode) {
    if (byCode.status !== "active") {
      await sb.from("certificates").update({ status: "active", updated_at: now }).eq("id", byCode.id);
    }
    return byCode.id;
  }

  const { data, error } = await sb
    .from("certificates")
    .insert({
      certificate_code: code,
      user_id: userId,
      event_id: EVENT_ID,
      enrollment_id: enrollmentId,
      status: "active",
      issued_at: now,
      metadata: { pending_account_link: true, source: "discovery-pdf-placeholder" },
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function verify(code) {
  const { data, error } = await sb.rpc("verify_certificate", {
    p_certificate_code: code,
    p_ip_hash: null,
    p_user_agent: "pending-discovery-script",
  });
  if (error) return { ok: false, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: Boolean(row?.is_valid), row };
}

for (const person of PENDING) {
  try {
    const userId = await ensureUser(person);
    const enrollmentId = await ensureEnrollment(userId, person.code);
    const att = await markAttendance(enrollmentId);
    const certId = await ensureCertificate(userId, enrollmentId, person.code);
    const v = await verify(person.code);
    console.log("OK", person.name, person.code, {
      userId,
      enrollmentId,
      attendance: att,
      certId,
      verify: v.ok,
      holder: v.row?.holder_name,
    });
  } catch (e) {
    console.error("FAIL", person.name, person.code, e.message || e);
  }
}

const maxSeq = Math.max(
  0,
  ...PENDING.map((p) => Number((p.code.match(/-(\d{5})$/) || [])[1] || 0)),
);
const year = new Date().getFullYear();
const { data: seq } = await sb
  .from("certificate_code_sequences")
  .select("last_value")
  .eq("program_code", "3DMO")
  .eq("issue_year", year)
  .maybeSingle();
if (seq && Number(seq.last_value) < maxSeq) {
  await sb
    .from("certificate_code_sequences")
    .update({ last_value: maxSeq })
    .eq("program_code", "3DMO")
    .eq("issue_year", year);
  console.log(`bumped sequence 3DMO/${year} -> ${maxSeq}`);
}
