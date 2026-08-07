import type { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseAdminAuditLogRepository } from "@/infrastructure/repositories/supabase-admin-audit-log-repository";

interface EnrollmentRemovalRow {
  id: string;
  status: string;
  user_id: string;
  event_id: string;
  student_code: string | null;
  profiles: { full_name?: string; email?: string | null } | { full_name?: string; email?: string | null }[] | null;
  events: { title?: string } | { title?: string }[] | null;
  certificates:
    | { id: string; status: string; certificate_code?: string }
    | { id: string; status: string; certificate_code?: string }[]
    | null;
}

function unwrapOne<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function collectCertificates(
  row: EnrollmentRemovalRow,
): Array<{ id: string; status: string; certificate_code?: string }> {
  if (!row.certificates) {
    return [];
  }

  return Array.isArray(row.certificates) ? row.certificates : [row.certificates];
}

function collectCodesToReclaim(row: EnrollmentRemovalRow): string[] {
  const codes = new Set<string>();

  if (row.student_code?.trim()) {
    codes.add(row.student_code.trim().toUpperCase());
  }

  for (const certificate of collectCertificates(row)) {
    if (certificate.certificate_code?.trim()) {
      codes.add(certificate.certificate_code.trim().toUpperCase());
    }
  }

  return [...codes];
}

async function reclaimCertificateCodes(
  client: SupabaseClient,
  codes: string[],
): Promise<void> {
  for (const code of codes) {
    const { error } = await client.rpc("reclaim_certificate_sequence", {
      p_certificate_code: code,
    });

    if (error) {
      throw new Error(`Sertifika numarası geri alınamadı (${code}): ${error.message}`);
    }
  }
}

export async function removeEnrollmentsFromEvent(
  client: SupabaseClient,
  input: {
    enrollmentIds: string[];
    actorId: string;
    actorEmail: string | null;
    reason: string | null;
  },
): Promise<{ removed: number }> {
  const enrollmentIds = Array.from(
    new Set(input.enrollmentIds.map((id) => id.trim()).filter(Boolean)),
  );

  if (enrollmentIds.length === 0) {
    throw new Error("Çıkarılacak kayıt seçilmedi.");
  }

  const { data: rows, error: fetchError } = await client
    .from("enrollments")
    .select(
      `
      id,
      status,
      user_id,
      event_id,
      student_code,
      profiles ( full_name, email ),
      events ( title ),
      certificates ( id, status, certificate_code )
    `,
    )
    .in("id", enrollmentIds);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const foundIds = new Set((rows ?? []).map((row) => row.id as string));
  const missing = enrollmentIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new Error("Seçilen kayıtlardan biri bulunamadı.");
  }

  const blocked = (rows ?? []).filter((row) =>
    collectCertificates(row as EnrollmentRemovalRow).some(
      (certificate) => certificate.status === "active",
    ),
  );

  if (blocked.length > 0) {
    throw new Error(
      "Aktif sertifikası olan kayıt kurstan çıkarılamaz. Önce Sertifikalar sayfasından sertifikayı iptal edin.",
    );
  }

  const codesToReclaim = [
    ...new Set((rows ?? []).flatMap((row) => collectCodesToReclaim(row as EnrollmentRemovalRow))),
  ];

  if (codesToReclaim.length > 0) {
    await reclaimCertificateCodes(client, codesToReclaim);
  }

  const revokedCertificateIds = (rows ?? []).flatMap((row) =>
    collectCertificates(row as EnrollmentRemovalRow)
      .filter((certificate) => certificate.status === "revoked")
      .map((certificate) => certificate.id),
  );

  if (revokedCertificateIds.length > 0) {
    const { error: certificateDeleteError } = await client
      .from("certificates")
      .delete()
      .in("id", revokedCertificateIds);

    if (certificateDeleteError) {
      throw new Error(certificateDeleteError.message);
    }
  }

  const audit = new SupabaseAdminAuditLogRepository(client);

  for (const row of rows ?? []) {
    const typedRow = row as EnrollmentRemovalRow;
    const profile = unwrapOne(typedRow.profiles);
    const event = unwrapOne(typedRow.events);

    await audit.logEnrollmentDeleted({
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      reason: input.reason,
      enrollmentId: typedRow.id,
      eventId: typedRow.event_id ?? null,
      eventTitle: event?.title ?? null,
      studentId: typedRow.user_id ?? null,
      studentName: profile?.full_name ?? null,
      studentEmail: profile?.email ?? null,
      metadata: {
        previous_status: typedRow.status,
        student_code: typedRow.student_code,
        reclaimed_codes: codesToReclaim,
        purge_mode: "hard_delete",
        action_label: "enrollment_removed_from_event",
      },
    });
  }

  const { data: deletedRows, error: deleteError } = await client
    .from("enrollments")
    .delete()
    .in("id", enrollmentIds)
    .select("id");

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const deletedCount = deletedRows?.length ?? 0;
  if (deletedCount !== enrollmentIds.length) {
    throw new Error(
      `Kayıt silinemedi (${deletedCount}/${enrollmentIds.length}). Yetki veya bağlı veri engeli olabilir.`,
    );
  }

  return { removed: deletedCount };
}
