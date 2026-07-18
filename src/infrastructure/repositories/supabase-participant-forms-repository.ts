import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ConsentFormType,
  EnrollmentFormProgress,
  IntakeFormInput,
  MediaPermissions,
  SubmitConsentsInput,
  SubmitPostTestInput,
  SurveyDimensionsInput,
} from "@/core/domain/participant-forms";
import {
  isCompleteMediaPermissions,
  requiresD2pTpsSurveys,
} from "@/core/domain/participant-forms";
import { SURVEY_FORM_VERSIONS } from "@/shared/constants/participant-forms";

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
        "full_name, gender, grade_level, school_name, city_district, experience_data, interests, motivation_data",
      )
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Profil bilgisi alınamadı.");
    }

    const [{ data: consents }, { data: health }, { data: intake }, { data: surveys }] =
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
      ]);

    const event = Array.isArray(enrollment.events) ? enrollment.events[0] : enrollment.events;
    const gradeLevel = profile.grade_level ?? "";

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
    };
  }

  async submitConsents(
    enrollmentId: string,
    userId: string,
    input: SubmitConsentsInput,
    ipAddress: string | null,
  ): Promise<{ ok: true }> {
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
      });

      if (healthError) {
        throw new Error(`Sağlık notu yazılamadı: ${healthError.message}`);
      }
    }

    return { ok: true };
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
  ): Promise<{ studentCode: string; skippedSurvey: boolean }> {
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

    const { data: studentCode, error: codeError } = await this.client.rpc(
      "assign_enrollment_student_code",
      { p_enrollment_id: enrollmentId },
    );

    if (codeError || !studentCode) {
      throw new Error(
        `Öğrenci kodu oluşturulamadı: ${codeError?.message ?? "Bilinmeyen hata"}`,
      );
    }

    const { error: stampError } = await this.client.rpc("mark_enrollment_form_timestamps", {
      p_enrollment_id: enrollmentId,
      p_intake: false,
      p_pre_test: true,
      // Non 5–8 skip both surveys → unlock certificate gate as well.
      p_post_test: skippedSurvey,
    });

    if (stampError) {
      throw new Error(`İlerleme güncellenemedi: ${stampError.message}`);
    }

    return {
      studentCode: String(studentCode),
      skippedSurvey,
    };
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
    });

    if (stampError) {
      throw new Error(`İlerleme güncellenemedi: ${stampError.message}`);
    }

    return { ok: true };
  }
}
