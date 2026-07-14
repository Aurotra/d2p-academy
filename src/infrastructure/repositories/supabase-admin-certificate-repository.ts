import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AdminCertificateRecord,
  IssueCertificateInput,
  PendingCertificateEnrollment,
  RevokeCertificateInput,
} from "@/core/domain/admin-certificate";
import type { CertificateStatus } from "@/core/domain/certificate-verification";
import type { AdminCertificateRepository } from "@/core/use-cases/manage-admin-certificates";
import { translateCertificateRpcError } from "@/infrastructure/certificates/translate-certificate-rpc-error";

interface CertificateRow {
  id: string;
  certificate_code: string;
  issued_at: string;
  status: CertificateStatus;
  pdf_url: string | null;
  profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  events: { title: string } | { title: string }[] | null;
}

interface PendingEnrollmentRow {
  id: string;
  completed_at: string;
  profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  events: { title: string } | { title: string }[] | null;
}

interface IssuedCertificateRow {
  id: string;
  certificate_code: string;
  issued_at: string;
  status: CertificateStatus;
  user_id: string;
  event_id: string;
}

function mapCertificate(row: CertificateRow): AdminCertificateRecord {
  const profile = Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles;
  const event = Array.isArray(row.events) ? (row.events[0] ?? null) : row.events;

  return {
    id: row.id,
    certificateCode: row.certificate_code,
    holderName: profile?.full_name ?? "Öğrenci",
    holderEmail: profile?.email ?? "",
    eventTitle: event?.title ?? "Eğitim",
    issuedAt: new Date(row.issued_at),
    status: row.status,
    pdfUrl: row.pdf_url ?? null,
  };
}

export class SupabaseAdminCertificateRepository implements AdminCertificateRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listAll(): Promise<AdminCertificateRecord[]> {
    const { data, error } = await this.client
      .from("certificates")
      .select(
        `
        id,
        certificate_code,
        issued_at,
        status,
        pdf_url,
        profiles ( full_name, email ),
        events ( title )
      `,
      )
      .order("issued_at", { ascending: false });

    if (error) {
      throw new Error(`Sertifikalar alınamadı: ${error.message}`);
    }

    return (data as CertificateRow[]).map(mapCertificate);
  }

  async listPendingEnrollments(): Promise<PendingCertificateEnrollment[]> {
    const { data, error } = await this.client
      .from("enrollments")
      .select(
        `
        id,
        completed_at,
        profiles ( full_name, email ),
        events ( title ),
        certificates ( id )
      `,
      )
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (error) {
      throw new Error(`Tamamlanan kayıtlar alınamadı: ${error.message}`);
    }

    return (data as Array<
      PendingEnrollmentRow & { certificates: { id: string } | { id: string }[] | null }
    >)
      .filter((row) => {
        const certificate = Array.isArray(row.certificates)
          ? (row.certificates[0] ?? null)
          : row.certificates;
        return !certificate;
      })
      .map((row) => {
        const profile = Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles;
        const event = Array.isArray(row.events) ? (row.events[0] ?? null) : row.events;

        return {
          id: row.id,
          studentName: profile?.full_name ?? "Öğrenci",
          studentEmail: profile?.email ?? "",
          eventTitle: event?.title ?? "Eğitim",
          completedAt: new Date(row.completed_at),
        };
      });
  }

  async issue(input: IssueCertificateInput): Promise<AdminCertificateRecord> {
    const { data, error } = await this.client.rpc("issue_certificate", {
      p_enrollment_id: input.enrollmentId,
    });

    if (error || !data) {
      throw new Error(
        `Sertifika oluşturulamadı: ${translateCertificateRpcError(error?.message)}`,
      );
    }

    const issued = data as IssuedCertificateRow;

    const { data: fullRecord, error: fetchError } = await this.client
      .from("certificates")
      .select(
        `
        id,
        certificate_code,
        issued_at,
        status,
        pdf_url,
        profiles ( full_name, email ),
        events ( title )
      `,
      )
      .eq("id", issued.id)
      .single();

    if (fetchError || !fullRecord) {
      throw new Error("Sertifika oluşturuldu ancak kayıt okunamadı.");
    }

    return mapCertificate(fullRecord as CertificateRow);
  }

  async revoke(input: RevokeCertificateInput): Promise<void> {
    const { error } = await this.client
      .from("certificates")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        revoke_reason: input.revokeReason.trim(),
      })
      .eq("id", input.certificateId);

    if (error) {
      throw new Error(`Sertifika iptal edilemedi: ${error.message}`);
    }
  }
}
