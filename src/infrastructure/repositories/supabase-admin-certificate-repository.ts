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
import {
  calculateProgress,
  isProfileComplete,
  PROFILE_REQUIRED_FOR_CERTIFICATE_MESSAGE,
} from "@/lib/utils/progress";
import { formatStudentContact } from "@/shared/utils/format-student-contact";
import {
  getEnrollmentFormStatus,
  type ConsentRecordSnapshot,
} from "@/shared/utils/enrollment-form-status";

interface CertificateRow {
  id: string;
  certificate_code: string;
  issued_at: string;
  status: CertificateStatus;
  pdf_url: string | null;
  profiles:
    | { full_name: string; email: string | null; username: string | null }
    | { full_name: string; email: string | null; username: string | null }[]
    | null;
  events: { title: string } | { title: string }[] | null;
}

interface PendingProfileRow {
  full_name: string;
  email: string | null;
  username: string | null;
  gender: string | null;
  grade_level: string | null;
  school_name: string | null;
  city_district: string | null;
  experience_data: {
    coding_experience?: string | null;
    proje_sayisi?: number | null;
  } | null;
  interests: string[] | null;
  motivation_data: {
    hedef?: string | null;
    beklenti?: number | null;
  } | null;
  profile_avatar_url: string | null;
}

interface PendingEnrollmentRow {
  id: string;
  completed_at: string | null;
  intake_form_completed_at: string | null;
  pre_test_completed_at: string | null;
  post_test_completed_at: string | null;
  profiles: PendingProfileRow | PendingProfileRow[] | null;
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
    holderEmail: formatStudentContact(profile?.email, profile?.username),
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
        profiles ( full_name, email, username ),
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
        intake_form_completed_at,
        pre_test_completed_at,
        post_test_completed_at,
        status,
        profiles (
          full_name,
          email,
          username,
          gender,
          grade_level,
          school_name,
          city_district,
          experience_data,
          interests,
          motivation_data,
          profile_avatar_url
        ),
        events ( title ),
        certificates ( id, status )
      `,
      )
      .not("intake_form_completed_at", "is", null)
      .in("status", ["registered", "attended", "completed"])
      .order("intake_form_completed_at", { ascending: false });

    if (error) {
      throw new Error(`Tamamlanan kayıtlar alınamadı: ${error.message}`);
    }

    const rows = (data as Array<
      PendingEnrollmentRow & {
        status: string;
        certificates:
          | { id: string; status: CertificateStatus }
          | { id: string; status: CertificateStatus }[]
          | null;
      }
    >) ?? [];

    const enrollmentIds = rows.map((row) => row.id);
    const consentsByEnrollment = new Map<string, ConsentRecordSnapshot[]>();

    if (enrollmentIds.length > 0) {
      const { data: consentRows, error: consentError } = await this.client
        .from("consent_records")
        .select("enrollment_id, form_type, accepted, media_permissions")
        .in("enrollment_id", enrollmentIds);

      if (consentError) {
        throw new Error(`Onay kayıtları alınamadı: ${consentError.message}`);
      }

      for (const row of consentRows ?? []) {
        const list = consentsByEnrollment.get(row.enrollment_id) ?? [];
        list.push({
          form_type: row.form_type,
          accepted: Boolean(row.accepted),
          media_permissions: row.media_permissions as ConsentRecordSnapshot["media_permissions"],
        });
        consentsByEnrollment.set(row.enrollment_id, list);
      }
    }

    return rows
      .filter((row) => {
        const certificates = Array.isArray(row.certificates)
          ? row.certificates
          : row.certificates
            ? [row.certificates]
            : [];
        if (certificates.some((certificate) => certificate.status === "active")) {
          return false;
        }

        const profile = Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles;
        if (!profile) {
          return false;
        }

        const formStatus = getEnrollmentFormStatus({
          gradeLevel: profile.grade_level,
          intakeFormCompletedAt: row.intake_form_completed_at,
          preTestCompletedAt: row.pre_test_completed_at,
          postTestCompletedAt: row.post_test_completed_at,
          consentRecords: consentsByEnrollment.get(row.id) ?? [],
        });

        return formStatus.allRequiredDone;
      })
      .map((row) => {
        const profile = Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles;
        const event = Array.isArray(row.events) ? (row.events[0] ?? null) : row.events;
        const readyAt =
          row.post_test_completed_at ??
          row.pre_test_completed_at ??
          row.intake_form_completed_at ??
          row.completed_at ??
          new Date().toISOString();
        const profileProgress = profile
          ? calculateProgress({
              full_name: profile.full_name,
              gender: profile.gender,
              grade_level: profile.grade_level,
              school_name: profile.school_name,
              city_district: profile.city_district,
              experience_data: profile.experience_data,
              interests: profile.interests,
              motivation_data: profile.motivation_data,
              profile_avatar_url: profile.profile_avatar_url,
            })
          : 0;
        const profileIncomplete = !profile || !isProfileComplete({
          full_name: profile.full_name,
          gender: profile.gender,
          grade_level: profile.grade_level,
          school_name: profile.school_name,
          city_district: profile.city_district,
          experience_data: profile.experience_data,
          interests: profile.interests,
          motivation_data: profile.motivation_data,
          profile_avatar_url: profile.profile_avatar_url,
        });

        return {
          id: row.id,
          studentName: profile?.full_name ?? "Öğrenci",
          studentEmail: formatStudentContact(profile?.email, profile?.username),
          eventTitle: event?.title ?? "Eğitim",
          completedAt: new Date(readyAt),
          profileIncomplete,
          profileProgress,
        };
      });
  }

  async issue(input: IssueCertificateInput): Promise<AdminCertificateRecord> {
    const { data: enrollment, error: enrollmentError } = await this.client
      .from("enrollments")
      .select(
        `
        id,
        profiles (
          full_name,
          gender,
          grade_level,
          school_name,
          city_district,
          experience_data,
          interests,
          motivation_data,
          profile_avatar_url
        )
      `,
      )
      .eq("id", input.enrollmentId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      throw new Error("Sertifika oluşturulamadı: Kayıt bulunamadı.");
    }

    const profile = Array.isArray(enrollment.profiles)
      ? (enrollment.profiles[0] ?? null)
      : enrollment.profiles;

    if (
      !profile ||
      !isProfileComplete({
        full_name: profile.full_name,
        gender: profile.gender,
        grade_level: profile.grade_level,
        school_name: profile.school_name,
        city_district: profile.city_district,
        experience_data: profile.experience_data,
        interests: profile.interests,
        motivation_data: profile.motivation_data,
        profile_avatar_url: profile.profile_avatar_url,
      })
    ) {
      throw new Error(`Sertifika oluşturulamadı: ${PROFILE_REQUIRED_FOR_CERTIFICATE_MESSAGE}`);
    }

    const { data: enrollmentForms, error: enrollmentFormsError } = await this.client
      .from("enrollments")
      .select("intake_form_completed_at, pre_test_completed_at, post_test_completed_at")
      .eq("id", input.enrollmentId)
      .maybeSingle();

    if (enrollmentFormsError || !enrollmentForms) {
      throw new Error("Sertifika oluşturulamadı: Kayıt bulunamadı.");
    }

    const { data: consentRows, error: consentError } = await this.client
      .from("consent_records")
      .select("form_type, accepted, media_permissions")
      .eq("enrollment_id", input.enrollmentId);

    if (consentError) {
      throw new Error(`Sertifika oluşturulamadı: ${consentError.message}`);
    }

    const formStatus = getEnrollmentFormStatus({
      gradeLevel: profile.grade_level,
      intakeFormCompletedAt: enrollmentForms.intake_form_completed_at,
      preTestCompletedAt: enrollmentForms.pre_test_completed_at,
      postTestCompletedAt: enrollmentForms.post_test_completed_at,
      consentRecords: (consentRows ?? []).map((row) => ({
        form_type: row.form_type,
        accepted: Boolean(row.accepted),
        media_permissions: row.media_permissions as ConsentRecordSnapshot["media_permissions"],
      })),
    });

    if (!formStatus.allRequiredDone) {
      throw new Error(
        "Sertifika oluşturulamadı: Katılımcı formları tamamlanmadan sertifika verilemez.",
      );
    }

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
        profiles ( full_name, email, username ),
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
    const { data: existing, error: fetchError } = await this.client
      .from("certificates")
      .select("id, pdf_url")
      .eq("id", input.certificateId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Sertifika iptal edilemedi: ${fetchError.message}`);
    }

    const { error } = await this.client.rpc("revoke_certificate", {
      p_certificate_id: input.certificateId,
      p_revoke_reason: input.revokeReason.trim(),
    });

    if (error) {
      throw new Error(
        `Sertifika iptal edilemedi: ${translateCertificateRpcError(error.message)}`,
      );
    }

    const pdfUrl = existing?.pdf_url as string | null | undefined;
    if (pdfUrl) {
      const marker = "/storage/v1/object/public/certificates/";
      const index = pdfUrl.indexOf(marker);
      if (index >= 0) {
        const storagePath = decodeURIComponent(pdfUrl.slice(index + marker.length));
        await this.client.storage.from("certificates").remove([storagePath]);
      }
    }
  }
}
