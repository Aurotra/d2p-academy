import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ConsentFormType,
  EnrollmentFormAnswers,
  EnrollmentFormProgress,
  IntakeFormInput,
  MediaPermissions,
  SubmitConsentsInput,
  SubmitPostTestInput,
  SurveyAnswerSnapshot,
  SurveyDimensionsInput,
  SurveyType,
} from "@/core/domain/participant-forms";
import {
  isCompleteMediaPermissions,
  isFullMediaConsentGranted,
  requiresD2pTpsSurveys,
} from "@/core/domain/participant-forms";
import { MEDIA_CONSENT_BLOCK_MESSAGE, SURVEY_FORM_VERSIONS } from "@/shared/constants/participant-forms";
import { calculateProgress, isProfileComplete } from "@/lib/utils/progress";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asNumberRecord(value: unknown): Record<string, number> {
  const source = asRecord(value);
  const result: Record<string, number> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      result[key] = entry;
      continue;
    }
    if (typeof entry === "string" && entry.trim() !== "") {
      const parsed = Number(entry);
      if (Number.isFinite(parsed)) {
        result[key] = parsed;
      }
    }
  }
  return result;
}

function asStringRecord(value: unknown): Record<string, string> {
  const source = asRecord(value);
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (typeof entry === "string") {
      result[key] = entry;
    }
  }
  return result;
}

interface EnrollmentOwnerRow {
  id: string;
  user_id: string;
  event_id: string;
  student_code: string | null;
  intake_form_completed_at: string | null;
  pre_test_completed_at: string | null;
  post_test_completed_at: string | null;
  events: { title: string; program_code: string | null } | { title: string; program_code: string | null }[] | null;
}

export class SupabaseParticipantFormsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async requireOwnedEnrollment(
    enrollmentId: string,
    userId: string,
  ): Promise<EnrollmentOwnerRow> {
    const { data, error } = await this.client
      .from("enrollments")
      .select(
        `
        id,
        user_id,
        event_id,
        student_code,
        intake_form_completed_at,
        pre_test_completed_at,
        post_test_completed_at,
        events ( title, program_code )
      `,
      )
      .eq("id", enrollmentId)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Kayıt bulunamadı.");
    }

    if (data.user_id !== userId) {
      throw new Error("Bu kayıt size ait değil.");
    }

    return data as EnrollmentOwnerRow;
  }

  async getWizardState(enrollmentId: string, userId: string): Promise<EnrollmentFormProgress> {
    const enrollment = await this.requireOwnedEnrollment(enrollmentId, userId);

    const { data: profile, error: profileError } = await this.client
      .from("profiles")
      .select(
        "full_name, gender, grade_level, school_name, city_district, experience_data, interests, motivation_data, profile_avatar_url",
      )
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Profil bilgisi alınamadı.");
    }

    const [{ data: consents }, { data: health }, { data: intake }, { data: surveys }, { data: certificate }] =
      await Promise.all([
        this.client
          .from("consent_records")
          .select("form_type, accepted, parent_signature, media_permissions, consent_text_version")
          .eq("enrollment_id", enrollmentId),
        this.client
          .from("health_notes")
          .select("id")
          .eq("enrollment_id", enrollmentId)
          .maybeSingle(),
        this.client
          .from("intake_responses")
          .select("id")
          .eq("enrollment_id", enrollmentId)
          .maybeSingle(),
        this.client
          .from("survey_responses")
          .select("survey_type")
          .eq("enrollment_id", enrollmentId),
        this.client
          .from("certificates")
          .select("id, status")
          .eq("enrollment_id", enrollmentId)
          .eq("status", "active")
          .maybeSingle(),
      ]);

    const event = Array.isArray(enrollment.events) ? enrollment.events[0] : enrollment.events;
    const gradeLevel = profile.grade_level ?? "";
    const profileProgressInput = {
      full_name: profile.full_name,
      gender: profile.gender,
      grade_level: profile.grade_level,
      school_name: profile.school_name,
      city_district: profile.city_district,
      experience_data: profile.experience_data as {
        coding_experience?: string | null;
        proje_sayisi?: number | null;
      } | null,
      interests: (profile.interests as string[] | null) ?? null,
      motivation_data: profile.motivation_data as {
        hedef?: string | null;
        beklenti?: number | null;
      } | null,
      profile_avatar_url: profile.profile_avatar_url,
    };
    const profileProgressPercent = calculateProgress(profileProgressInput);

    return {
      id: enrollment.id,
      eventId: enrollment.event_id,
      eventTitle: event?.title ?? "Eğitim",
      studentCode: enrollment.student_code,
      intakeFormCompletedAt: enrollment.intake_form_completed_at,
      preTestCompletedAt: enrollment.pre_test_completed_at,
      postTestCompletedAt: enrollment.post_test_completed_at,
      gradeLevel,
      requiresSurveys: requiresD2pTpsSurveys(gradeLevel),
      profilePrefill: {
        fullName: profile.full_name ?? "",
        gender: profile.gender ?? "",
        gradeLevel,
        schoolName: profile.school_name ?? "",
        cityDistrict: profile.city_district ?? "",
        experienceData: (profile.experience_data as Record<string, unknown>) ?? {},
        interests: (profile.interests as string[]) ?? [],
        motivationData: (profile.motivation_data as Record<string, unknown>) ?? {},
      },
      consents: (consents ?? []).map((row) => ({
        formType: row.form_type as ConsentFormType,
        accepted: Boolean(row.accepted),
        parentSignature: row.parent_signature ?? "",
        mediaPermissions: isCompleteMediaPermissions(row.media_permissions)
          ? (row.media_permissions as MediaPermissions)
          : null,
        consentTextVersion: row.consent_text_version,
      })),
      hasHealthNote: Boolean(health?.id),
      hasIntake: Boolean(intake?.id),
      hasPreTest: (surveys ?? []).some((row) => row.survey_type === "pre_test"),
      hasPostTest: (surveys ?? []).some((row) => row.survey_type === "post_test"),
      hasActiveCertificate: Boolean(certificate?.id),
      profileProgressPercent,
      profileComplete: isProfileComplete(profileProgressInput),
    };
  }

  async getEnrollmentFormAnswers(enrollmentId: string): Promise<EnrollmentFormAnswers> {
    const { data: enrollment, error: enrollmentError } = await this.client
      .from("enrollments")
      .select(
        `
        id,
        user_id,
        event_id,
        student_code,
        intake_form_completed_at,
        pre_test_completed_at,
        post_test_completed_at,
        events ( id, title, program_code ),
        profiles ( full_name, email, grade_level )
      `,
      )
      .eq("id", enrollmentId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      throw new Error("Kayıt bulunamadı.");
    }

    const event = Array.isArray(enrollment.events) ? enrollment.events[0] : enrollment.events;
    const profile = Array.isArray(enrollment.profiles)
      ? enrollment.profiles[0]
      : enrollment.profiles;
    const gradeLevel = profile?.grade_level ?? "";

    const [
      { data: consents },
      { data: health },
      { data: intake },
      { data: surveys },
      { data: postExtra },
    ] = await Promise.all([
      this.client
        .from("consent_records")
        .select(
          "form_type, accepted, accepted_at, parent_signature, media_permissions, consent_text_version",
        )
        .eq("enrollment_id", enrollmentId),
      this.client
        .from("health_notes")
        .select("note")
        .eq("enrollment_id", enrollmentId)
        .maybeSingle(),
      this.client
        .from("intake_responses")
        .select(
          "previous_experience, tech_access, interests, motivation, motivation_other, intake_likert, open_ended, updated_at",
        )
        .eq("enrollment_id", enrollmentId)
        .maybeSingle(),
      this.client
        .from("survey_responses")
        .select(
          "survey_type, form_version, submitted_at, dimension_1, dimension_2, dimension_3, dimension_4, dimension_5, open_ended",
        )
        .eq("enrollment_id", enrollmentId),
      this.client
        .from("post_test_extra")
        .select("training_impact, future_trends, open_ended")
        .eq("enrollment_id", enrollmentId)
        .maybeSingle(),
    ]);

    const mapSurvey = (row: {
      survey_type: string;
      form_version: string | null;
      submitted_at: string | null;
      dimension_1: unknown;
      dimension_2: unknown;
      dimension_3: unknown;
      dimension_4: unknown;
      dimension_5: unknown;
      open_ended: string | null;
    }): SurveyAnswerSnapshot => ({
      surveyType: row.survey_type as SurveyType,
      formVersion: row.form_version,
      submittedAt: row.submitted_at,
      dimensions: {
        dimension1: asNumberRecord(row.dimension_1),
        dimension2: asNumberRecord(row.dimension_2),
        dimension3: asNumberRecord(row.dimension_3),
        dimension4: asNumberRecord(row.dimension_4),
        dimension5: asNumberRecord(row.dimension_5),
      },
      openEnded: row.open_ended,
    });

    const surveyRows = surveys ?? [];
    const preTestRow = surveyRows.find((row) => row.survey_type === "pre_test");
    const postTestRow = surveyRows.find((row) => row.survey_type === "post_test");

    return {
      enrollmentId: enrollment.id,
      eventId: enrollment.event_id,
      eventTitle: event?.title ?? "Eğitim",
      eventProgramCode: event?.program_code ?? null,
      studentName: profile?.full_name ?? "Öğrenci",
      studentEmail: profile?.email ?? "—",
      studentCode: enrollment.student_code,
      gradeLevel,
      requiresSurveys: requiresD2pTpsSurveys(gradeLevel),
      intakeFormCompletedAt: enrollment.intake_form_completed_at,
      preTestCompletedAt: enrollment.pre_test_completed_at,
      postTestCompletedAt: enrollment.post_test_completed_at,
      healthNote: health?.note ?? null,
      consents: (consents ?? []).map((row) => ({
        formType: row.form_type as ConsentFormType,
        accepted: Boolean(row.accepted),
        acceptedAt: row.accepted_at,
        parentSignature: row.parent_signature,
        mediaPermissions: isCompleteMediaPermissions(row.media_permissions)
          ? (row.media_permissions as MediaPermissions)
          : null,
        consentTextVersion: row.consent_text_version,
      })),
      intake: intake
        ? {
            previousExperience: asRecord(intake.previous_experience),
            techAccess: asRecord(intake.tech_access),
            interests: asRecord(intake.interests),
            motivation: asRecord(intake.motivation),
            motivationOther: intake.motivation_other,
            intakeLikert: asNumberRecord(intake.intake_likert),
            openEnded: asStringRecord(intake.open_ended),
            submittedAt: intake.updated_at,
          }
        : null,
      preTest: preTestRow ? mapSurvey(preTestRow) : null,
      postTest: postTestRow ? mapSurvey(postTestRow) : null,
      postTestExtra: postExtra
        ? {
            trainingImpact: asNumberRecord(postExtra.training_impact),
            futureTrends: asNumberRecord(postExtra.future_trends),
            openEnded: asStringRecord(postExtra.open_ended),
          }
        : null,
    };
  }

  async submitConsents(
    enrollmentId: string,
    userId: string,
    input: SubmitConsentsInput,
    ipAddress: string | null,
  ): Promise<{ ok: true; studentCode: string }> {
    await this.requireOwnedEnrollment(enrollmentId, userId);

    if (input.consents.length !== 3) {
      throw new Error("Üç onay formu (bilimsel, görsel, katılım) zorunludur.");
    }

    const types = new Set(input.consents.map((item) => item.formType));
    if (
      !types.has("scientific") ||
      !types.has("media") ||
      !types.has("participation")
    ) {
      throw new Error("Eksik onay formu türü var.");
    }

    for (const consent of input.consents) {
      if (!consent.accepted) {
        throw new Error("Tüm onay formları kabul edilmelidir.");
      }
      if (!consent.parentSignature.trim()) {
        throw new Error("Veli / yasal temsilci ad soyad zorunludur.");
      }

      let mediaPermissions: MediaPermissions | null = null;
      if (consent.formType === "media") {
        if (!isCompleteMediaPermissions(consent.mediaPermissions)) {
          throw new Error("Görsel izin matrisinin 7 kalemi de doldurulmalıdır.");
        }
        if (!isFullMediaConsentGranted(consent.mediaPermissions)) {
          throw new Error(MEDIA_CONSENT_BLOCK_MESSAGE);
        }
        mediaPermissions = consent.mediaPermissions;
      }

      const { error } = await this.client.from("consent_records").upsert(
        {
          enrollment_id: enrollmentId,
          form_type: consent.formType,
          accepted: true,
          accepted_at: new Date().toISOString(),
          ip_address: ipAddress,
          consent_text_version: consent.consentTextVersion,
          media_permissions: mediaPermissions,
          parent_signature: consent.parentSignature.trim(),
        },
        { onConflict: "enrollment_id,form_type" },
      );

      if (error) {
        throw new Error(`Onay kaydı yazılamadı: ${error.message}`);
      }
    }

    const note = input.healthNote?.trim() ?? "";
    if (note) {
      const { error: healthError } = await this.client.rpc("upsert_own_health_note", {
        p_enrollment_id: enrollmentId,
        p_note: note,
        p_actor_id: userId,
      });

      if (healthError) {
        throw new Error(`Sağlık notu yazılamadı: ${healthError.message}`);
      }
    }

    const { data: studentCode, error: codeError } = await this.client.rpc(
      "assign_enrollment_student_code",
      { p_enrollment_id: enrollmentId, p_actor_id: userId },
    );

    if (codeError || !studentCode) {
      throw new Error(
        `Öğrenci kodu oluşturulamadı: ${codeError?.message ?? "Bilinmeyen hata"}`,
      );
    }

    return { ok: true, studentCode: String(studentCode) };
  }

  async submitIntake(
    enrollmentId: string,
    userId: string,
    input: IntakeFormInput,
  ): Promise<{ ok: true }> {
    await this.requireOwnedEnrollment(enrollmentId, userId);

    const { error } = await this.client.from("intake_responses").upsert(
      {
        enrollment_id: enrollmentId,
        previous_experience: input.previousExperience,
        tech_access: input.techAccess,
        interests: input.interests,
        motivation: input.motivation,
        motivation_other: input.motivationOther?.trim() || null,
        intake_likert: input.intakeLikert,
        open_ended: input.openEnded,
      },
      { onConflict: "enrollment_id" },
    );

    if (error) {
      throw new Error(`Tanıma formu kaydedilemedi: ${error.message}`);
    }

    const { error: stampError } = await this.client.rpc("mark_enrollment_form_timestamps", {
      p_enrollment_id: enrollmentId,
      p_intake: true,
      p_pre_test: false,
      p_post_test: false,
      p_actor_id: userId,
    });

    if (stampError) {
      throw new Error(`İlerleme güncellenemedi: ${stampError.message}`);
    }

    return { ok: true };
  }

  async submitPreTest(
    enrollmentId: string,
    userId: string,
    input: SurveyDimensionsInput | null,
  ): Promise<{ skippedSurvey: boolean }> {
    await this.requireOwnedEnrollment(enrollmentId, userId);

    const { data: profile, error: profileError } = await this.client
      .from("profiles")
      .select("grade_level")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Sınıf bilgisi okunamadı.");
    }

    const requiresSurvey = requiresD2pTpsSurveys(profile.grade_level);
    const skippedSurvey = !requiresSurvey;

    if (requiresSurvey) {
      if (!input) {
        throw new Error("5–8. sınıflar için ön test zorunludur.");
      }

      const { error: surveyError } = await this.client.from("survey_responses").upsert(
        {
          enrollment_id: enrollmentId,
          survey_type: "pre_test",
          form_version: SURVEY_FORM_VERSIONS.pre_test,
          dimension_1: input.dimension1,
          dimension_2: input.dimension2,
          dimension_3: input.dimension3,
          dimension_4: input.dimension4,
          dimension_5: input.dimension5,
          open_ended: input.openEnded?.trim() || null,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "enrollment_id,survey_type" },
      );

      if (surveyError) {
        throw new Error(`Ön test kaydedilemedi: ${surveyError.message}`);
      }
    }

    const { error: stampError } = await this.client.rpc("mark_enrollment_form_timestamps", {
      p_enrollment_id: enrollmentId,
      p_intake: false,
      p_pre_test: true,
      // Non 5–8 skip both surveys → unlock certificate gate as well.
      p_post_test: skippedSurvey,
      p_actor_id: userId,
    });

    if (stampError) {
      throw new Error(`İlerleme güncellenemedi: ${stampError.message}`);
    }

    return { skippedSurvey };
  }

  async submitPostTest(
    enrollmentId: string,
    userId: string,
    input: SubmitPostTestInput,
  ): Promise<{ ok: true }> {
    await this.requireOwnedEnrollment(enrollmentId, userId);

    const { data: profile } = await this.client
      .from("profiles")
      .select("grade_level")
      .eq("id", userId)
      .single();

    if (!requiresD2pTpsSurveys(profile?.grade_level)) {
      throw new Error("Bu sınıf düzeyi için son test gerekmez.");
    }

    const { error: surveyError } = await this.client.from("survey_responses").upsert(
      {
        enrollment_id: enrollmentId,
        survey_type: "post_test",
        form_version: SURVEY_FORM_VERSIONS.post_test,
        dimension_1: input.dimension1,
        dimension_2: input.dimension2,
        dimension_3: input.dimension3,
        dimension_4: input.dimension4,
        dimension_5: input.dimension5,
        open_ended: input.openEnded?.trim() || null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "enrollment_id,survey_type" },
    );

    if (surveyError) {
      throw new Error(`Son test kaydedilemedi: ${surveyError.message}`);
    }

    const { error: extraError } = await this.client.from("post_test_extra").upsert(
      {
        enrollment_id: enrollmentId,
        training_impact: input.extra.trainingImpact,
        future_trends: input.extra.futureTrends,
        open_ended: input.extra.openEnded,
      },
      { onConflict: "enrollment_id" },
    );

    if (extraError) {
      throw new Error(`Son test ek alanları kaydedilemedi: ${extraError.message}`);
    }

    const { error: stampError } = await this.client.rpc("mark_enrollment_form_timestamps", {
      p_enrollment_id: enrollmentId,
      p_intake: false,
      p_pre_test: false,
      p_post_test: true,
      p_actor_id: userId,
    });

    if (stampError) {
      throw new Error(`İlerleme güncellenemedi: ${stampError.message}`);
    }

    return { ok: true };
  }
}
