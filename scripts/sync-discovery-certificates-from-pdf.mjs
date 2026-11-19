/**
 * One-off: sync Discovery PDF certificate codes into DB so /dogrula works.
 * - Match enrollments by student_code (or name + 3DMO event)
 * - Mark all session attendance as present
 * - Mark enrollment completed + stamp forms if missing
 * - Ensure certificates row exists with PDF code
 *
 * Usage: node --env-file=.env.local scripts/sync-discovery-certificates-from-pdf.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const certs = JSON.parse(fs.readFileSync(path.join(root, ".tmp-discovery-certs.json"), "utf8"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const now = new Date().toISOString();

function normalizeName(n) {
  return String(n || "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

async function findEnrollment(name, code) {
  const { data: byCode, error: codeErr } = await sb
    .from("enrollments")
    .select(
      "id, status, student_code, event_id, user_id, intake_form_completed_at, pre_test_completed_at, post_test_completed_at, completed_at, events!inner(id, title, program_code)",
    )
    .eq("student_code", code)
    .maybeSingle();
  if (codeErr) throw codeErr;
  if (byCode) return byCode;

  const { data: candidates, error } = await sb
    .from("enrollments")
    .select(
      "id, status, student_code, event_id, user_id, intake_form_completed_at, pre_test_completed_at, post_test_completed_at, completed_at, events!inner(id, title, program_code), profiles!inner(full_name)",
    )
    .eq("events.program_code", "3DMO")
    .in("status", ["registered", "attended", "completed", "cancelled"]);
  if (error) throw error;

  const want = normalizeName(name);
  const scored = (candidates || [])
    .map((row) => {
      const full = normalizeName(row.profiles?.full_name);
      let score = 0;
      if (full === want) score = 3;
      else if (full.includes(want) || want.includes(full)) score = 2;
      else {
        const wt = want.split(" ");
        const ft = full.split(" ");
        const overlap = wt.filter((t) => ft.includes(t)).length;
        if (overlap >= 2) score = 1;
      }
      return { row, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.row || null;
}

async function markAttendancePresent(enrollmentId, eventId) {
  const { data: sessions, error: sessErr } = await sb
    .from("event_sessions")
    .select("id")
    .eq("event_id", eventId);
  if (sessErr) throw sessErr;
  if (!sessions?.length) {
    return { sessionCount: 0, upserted: 0 };
  }

  const rows = sessions.map((s) => ({
    enrollment_id: enrollmentId,
    session_id: s.id,
    status: "present",
    marked_at: now,
    updated_at: now,
  }));

  const { error } = await sb.from("enrollment_session_attendance").upsert(rows, {
    onConflict: "enrollment_id,session_id",
  });
  if (error) throw error;
  return { sessionCount: sessions.length, upserted: rows.length };
}

async function ensureCompletedAndForms(enrollment) {
  const patch = {
    status: "completed",
    completed_at: enrollment.completed_at || now,
    updated_at: now,
    intake_form_completed_at: enrollment.intake_form_completed_at || now,
    pre_test_completed_at: enrollment.pre_test_completed_at || now,
    post_test_completed_at: enrollment.post_test_completed_at || now,
    post_test_unlocked_at: now,
  };

  const { error } = await sb.from("enrollments").update(patch).eq("id", enrollment.id);
  if (error) throw error;
}

async function ensureStudentCode(enrollmentId, code) {
  const { error } = await sb
    .from("enrollments")
    .update({ student_code: code, updated_at: now })
    .eq("id", enrollmentId);
  if (error) throw error;
}

async function ensureCertificate(enrollment, code) {
  const { data: existing, error: exErr } = await sb
    .from("certificates")
    .select("id, certificate_code, status")
    .eq("certificate_code", code)
    .maybeSingle();
  if (exErr) throw exErr;

  if (existing) {
    if (existing.status !== "active") {
      const { error } = await sb
        .from("certificates")
        .update({ status: "active", updated_at: now })
        .eq("id", existing.id);
      if (error) throw error;
      return { action: "reactivated", id: existing.id };
    }
    return { action: "exists", id: existing.id };
  }

  const { data: byEnrollment, error: enErr } = await sb
    .from("certificates")
    .select("id, certificate_code, status")
    .eq("enrollment_id", enrollment.id)
    .maybeSingle();
  if (enErr) throw enErr;

  if (byEnrollment) {
    const { error } = await sb
      .from("certificates")
      .update({
        certificate_code: code,
        status: "active",
        updated_at: now,
      })
      .eq("id", byEnrollment.id);
    if (error) throw error;
    return { action: "updated_code", id: byEnrollment.id };
  }

  const { data: inserted, error: insErr } = await sb
    .from("certificates")
    .insert({
      certificate_code: code,
      user_id: enrollment.user_id,
      event_id: enrollment.event_id,
      enrollment_id: enrollment.id,
      status: "active",
      issued_at: now,
    })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return { action: "inserted", id: inserted.id };
}

async function verifyCode(code) {
  const { data, error } = await sb.rpc("verify_certificate", {
    p_certificate_code: code,
    p_ip_hash: null,
    p_user_agent: "sync-discovery-script",
  });
  if (error) return { ok: false, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: Boolean(row?.is_valid ?? row?.isValid), raw: row };
}

const summary = [];
for (const row of certs) {
  const item = { name: row.name, code: row.code, steps: [] };
  try {
    const enrollment = await findEnrollment(row.name, row.code);
    if (!enrollment) {
      item.error = "enrollment_not_found";
      summary.push(item);
      console.error("NOT FOUND", row.name, row.code);
      continue;
    }
    item.enrollmentId = enrollment.id;
    item.event = enrollment.events?.title || enrollment.event_id;

    await ensureStudentCode(enrollment.id, row.code);
    item.steps.push("student_code");

    const att = await markAttendancePresent(enrollment.id, enrollment.event_id);
    item.steps.push(`attendance:${att.upserted}/${att.sessionCount}`);

    await ensureCompletedAndForms(enrollment);
    item.steps.push("completed+forms");

    const cert = await ensureCertificate(enrollment, row.code);
    item.steps.push(`certificate:${cert.action}`);

    const v = await verifyCode(row.code);
    item.verify = v.ok;
    if (!v.ok) item.verifyError = v.error || JSON.stringify(v.raw);
    summary.push(item);
    console.log("OK", row.name, row.code, item.steps.join(", "), "verify=", item.verify);
  } catch (e) {
    item.error = e.message || String(e);
    summary.push(item);
    console.error("FAIL", row.name, row.code, item.error);
  }
}

fs.writeFileSync(path.join(root, ".tmp-discovery-sync-result.json"), JSON.stringify(summary, null, 2));
const ok = summary.filter((s) => s.verify).length;
const fail = summary.filter((s) => !s.verify).length;
console.log(`\nDone: verify_ok=${ok} fail=${fail} total=${summary.length}`);
