import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { tryNormalizeProgramCode } from "@/shared/utils/program-code";

const LEGACY_AZ_ONLY_ERROR =
  /Yalnızca A[–-]Z harflerine izin verilir|Only A[–-]Z letters are allowed/i;

function isLegacyAzOnlyProgramCodeError(message: string | undefined): boolean {
  return Boolean(message && LEGACY_AZ_ONLY_ERROR.test(message));
}

/** App-side sequence bump matching generate_certificate_code (A–Z, 0–9). */
export async function generateCertificateCodeViaTables(
  client: SupabaseClient,
  programCodeRaw: string,
  issuedAt: Date = new Date(),
): Promise<string> {
  const programCode = tryNormalizeProgramCode(programCodeRaw);
  if (!programCode) {
    throw new Error(
      "Geçersiz program kodu. 2–4 karakter kullanın (A–Z, 0–9; ör. DC, 3DTY).",
    );
  }

  const year = issuedAt.getUTCFullYear();
  const yy = String(year % 100).padStart(2, "0");
  const startValue = 100;

  const { data: existing, error: readError } = await client
    .from("certificate_code_sequences")
    .select("last_value")
    .eq("program_code", programCode)
    .eq("issue_year", year)
    .maybeSingle();

  if (readError) {
    throw new Error(`Sertifika sıra numarası okunamadı: ${readError.message}`);
  }

  let nextValue: number;
  if (!existing) {
    const { data: inserted, error: insertError } = await client
      .from("certificate_code_sequences")
      .insert({
        program_code: programCode,
        issue_year: year,
        last_value: startValue,
      })
      .select("last_value")
      .single();

    if (insertError) {
      // Concurrent insert — retry as increment
      if (insertError.code === "23505") {
        const { data: bumped, error: bumpError } = await client.rpc(
          "generate_certificate_code",
          { p_program_code: programCode },
        );
        if (bumpError || !bumped) {
          throw new Error(
            `Sertifika kodu üretilemedi: ${bumpError?.message ?? "çakışma"}`,
          );
        }
        return String(bumped);
      }
      throw new Error(`Sertifika sıra numarası yazılamadı: ${insertError.message}`);
    }
    nextValue = Number(inserted.last_value);
  } else {
    nextValue = Number(existing.last_value) + 1;
    const { data: updated, error: updateError } = await client
      .from("certificate_code_sequences")
      .update({ last_value: nextValue })
      .eq("program_code", programCode)
      .eq("issue_year", year)
      .eq("last_value", existing.last_value)
      .select("last_value")
      .maybeSingle();

    if (updateError) {
      throw new Error(`Sertifika sıra numarası güncellenemedi: ${updateError.message}`);
    }
    if (!updated) {
      throw new Error("Sertifika sıra numarası güncellenemedi: eşzamanlı güncelleme.");
    }
  }

  return `D2P-${programCode}-${yy}-${String(nextValue).padStart(5, "0")}`;
}

/**
 * Assigns student_code via RPC; if live DB still rejects alphanumeric program
 * codes (pre-migration 088/090), falls back to table-level generation.
 */
export async function assignEnrollmentStudentCodeWithFallback(
  client: SupabaseClient,
  enrollmentId: string,
  actorId: string,
): Promise<string> {
  const { data: studentCode, error: codeError } = await client.rpc(
    "assign_enrollment_student_code",
    { p_enrollment_id: enrollmentId, p_actor_id: actorId },
  );

  if (!codeError && studentCode) {
    return String(studentCode);
  }

  if (!isLegacyAzOnlyProgramCodeError(codeError?.message)) {
    throw new Error(
      `Öğrenci kodu oluşturulamadı: ${codeError?.message ?? "Bilinmeyen hata"}`,
    );
  }

  // Legacy DB function rejects digits (e.g. 3DMO). Bypass with service role.
  let admin: SupabaseClient;
  try {
    admin = createServiceRoleClient();
  } catch {
    throw new Error(
      `Öğrenci kodu oluşturulamadı: ${codeError?.message ?? "Bilinmeyen hata"}`,
    );
  }

  const { data: enrollment, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id, student_code, event_id, events ( program_code )")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (enrollmentError || !enrollment) {
    throw new Error(
      `Öğrenci kodu oluşturulamadı: ${enrollmentError?.message ?? "Kayıt bulunamadı."}`,
    );
  }

  if (enrollment.student_code?.trim()) {
    return enrollment.student_code.trim();
  }

  const event = enrollment.events as { program_code: string | null } | null;
  const programCode = event?.program_code?.trim() ?? "";
  if (!programCode) {
    throw new Error(
      "Etkinlikte program kodu eksik. Önce etkinliğe program_code atayın (ör. DC, 3DMO).",
    );
  }

  const generated = await generateCertificateCodeViaTables(admin, programCode);

  const { error: updateError } = await admin
    .from("enrollments")
    .update({
      student_code: generated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId)
    .is("student_code", null);

  if (updateError) {
    throw new Error(`Öğrenci kodu kaydedilemedi: ${updateError.message}`);
  }

  const { data: after } = await admin
    .from("enrollments")
    .select("student_code")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (!after?.student_code) {
    throw new Error("Öğrenci kodu kaydedilemedi: eşzamanlı güncelleme.");
  }

  return after.student_code;
}
