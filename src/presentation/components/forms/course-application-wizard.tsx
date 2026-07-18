"use client";

import { useEffect, useState } from "react";

import type {
  EnrollmentFormProgress,
  MediaPermissions,
  SurveyDimensionsInput,
} from "@/core/domain/participant-forms";
import { MEDIA_PERMISSION_KEYS } from "@/core/domain/participant-forms";
import { ConsentDocumentCard } from "@/presentation/components/forms/consent-document-card";
import { LikertScaleGroup } from "@/presentation/components/forms/likert-scale-group";
import { MediaConsentMatrix } from "@/presentation/components/forms/media-consent-matrix";
import { OptionChipGroup } from "@/presentation/components/forms/option-chip-group";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";
import {
  CONSENT_DOCUMENTS,
  CONSENT_TEXT_VERSIONS,
  EMPTY_MEDIA_PERMISSIONS,
  FUTURE_TRENDS_QUESTIONS,
  INTAKE_INTEREST_FIELDS,
  INTAKE_LIKERT_QUESTIONS,
  INTAKE_MOTIVATION_REASONS,
  INTAKE_OPEN_ENDED,
  INTAKE_PREVIOUS_EXPERIENCE_FIELDS,
  INTAKE_TECH_ACCESS_FIELDS,
  POST_TEST_OPEN_ENDED,
  PRE_TEST_OPEN_ENDED,
  TPS_SURVEY_DIMENSIONS,
  TRAINING_IMPACT_QUESTIONS,
} from "@/shared/constants/participant-forms";
import { GRADE_LEVEL_OPTIONS } from "@/shared/constants/profile-options";

interface CourseApplicationWizardProps {
  enrollmentId: string;
}

type WizardStep = 1 | 2 | 3 | 4;
type StepTone = "done" | "action" | "idle";

const GENDER_LABELS: Record<string, string> = {
  male: "Erkek",
  female: "Kız",
  prefer_not_to_say: "Belirtmek istemiyorum",
};

function formatGradeLevel(value: string | null | undefined): string {
  if (!value) return "belirtilmemiş";
  return GRADE_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function formatGender(value: string | null | undefined): string {
  if (!value) return "—";
  return GENDER_LABELS[value] ?? value;
}
function stepToneClass(tone: StepTone, isActive: boolean): string {
  const ring = isActive ? " ring-2 ring-offset-2 ring-sky-400" : "";

  if (tone === "done") {
    return `bg-emerald-600 text-white${ring}`;
  }
  if (tone === "action") {
    return `bg-red-600 text-white${ring}`;
  }
  return `border border-slate-200 bg-slate-100/70 text-slate-400${ring}`;
}


function emptyLikert(ids: string[]): Record<string, number> {
  return Object.fromEntries(ids.map((id) => [id, 0]));
}

function allLikertAnswered(values: Record<string, number>, ids: string[]): boolean {
  return ids.every((id) => typeof values[id] === "number" && values[id] >= 1 && values[id] <= 5);
}

function emptyDimensionState(): Record<string, Record<string, number>> {
  return Object.fromEntries(
    TPS_SURVEY_DIMENSIONS.map((dimension) => [
      dimension.key,
      emptyLikert(dimension.questions.map((question) => question.id)),
    ]),
  );
}

function collectDimensions(
  source: Record<string, Record<string, number>>,
): SurveyDimensionsInput {
  return {
    dimension1: source.dimension_1 ?? {},
    dimension2: source.dimension_2 ?? {},
    dimension3: source.dimension_3 ?? {},
    dimension4: source.dimension_4 ?? {},
    dimension5: source.dimension_5 ?? {},
  };
}

function requireSingle(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} sorusunu yanıtlayın.`);
  }
}

function requireMulti(value: string[], label: string) {
  if (value.length === 0) {
    throw new Error(`${label} için en az bir seçim yapın.`);
  }
}

export function CourseApplicationWizard({ enrollmentId }: CourseApplicationWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [state, setState] = useState<EnrollmentFormProgress | null>(null);

  const [parentSignature, setParentSignature] = useState("");
  const [scientificAccepted, setScientificAccepted] = useState(false);
  const [participationAccepted, setParticipationAccepted] = useState(false);
  const [mediaAccepted, setMediaAccepted] = useState(false);
  const [mediaPermissions, setMediaPermissions] =
    useState<MediaPermissions>(EMPTY_MEDIA_PERMISSIONS);
  const [healthNote, setHealthNote] = useState("");

  const [previousExperience, setPreviousExperience] = useState<Record<string, string | string[]>>(
    {},
  );
  const [techAccess, setTechAccess] = useState<Record<string, string>>({});
  const [interests, setInterests] = useState<Record<string, string[]>>({});
  const [motivationReasons, setMotivationReasons] = useState<string[]>([]);
  const [motivationOther, setMotivationOther] = useState("");
  const [intakeLikert, setIntakeLikert] = useState(() =>
    emptyLikert(INTAKE_LIKERT_QUESTIONS.map((question) => question.id)),
  );
  const [learnMost, setLearnMost] = useState("");
  const [designWish, setDesignWish] = useState("");
  const [expectation, setExpectation] = useState("");

  const [preDimensions, setPreDimensions] = useState(emptyDimensionState);
  const [preOpenEnded, setPreOpenEnded] = useState("");

  const [postDimensions, setPostDimensions] = useState(emptyDimensionState);
  const [trainingImpact, setTrainingImpact] = useState(() =>
    emptyLikert(TRAINING_IMPACT_QUESTIONS.map((question) => question.id)),
  );
  const [futureTrends, setFutureTrends] = useState(() =>
    emptyLikert(FUTURE_TRENDS_QUESTIONS.map((question) => question.id)),
  );
  const [favoriteActivity, setFavoriteActivity] = useState("");
  const [mostImportantLearning, setMostImportantLearning] = useState("");
  const [nextTopics, setNextTopics] = useState("");
  const [productIdea, setProductIdea] = useState("");

  async function loadState() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/enrollments/${enrollmentId}/forms`);
      const payload = (await response.json()) as
        | { data: EnrollmentFormProgress }
        | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Form durumu alınamadı.");
      }

      const next = payload.data;
      setState(next);

      const media = next.consents.find((item) => item.formType === "media");
      const scientific = next.consents.find((item) => item.formType === "scientific");
      const participation = next.consents.find((item) => item.formType === "participation");

      setParentSignature(
        media?.parentSignature ||
          scientific?.parentSignature ||
          participation?.parentSignature ||
          next.profilePrefill.fullName ||
          "",
      );
      setScientificAccepted(Boolean(scientific?.accepted));
      setParticipationAccepted(Boolean(participation?.accepted));
      setMediaAccepted(Boolean(media?.accepted));
      if (media?.mediaPermissions) {
        setMediaPermissions(media.mediaPermissions);
      }

      if (!next.consents.some((item) => item.accepted)) {
        setStep(1);
      } else if (!next.intakeFormCompletedAt || (next.requiresSurveys && !next.preTestCompletedAt)) {
        setStep(2);
      } else if (next.requiresSurveys && !next.postTestCompletedAt) {
        setStep(3);
      } else if (!next.hasActiveCertificate) {
        setStep(4);
      } else {
        setStep(4);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Yükleme hatası.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId]);

  async function submitConsents() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!scientificAccepted || !participationAccepted || !mediaAccepted) {
        throw new Error("Tüm onay kutularını işaretleyin.");
      }
      if (!parentSignature.trim()) {
        throw new Error("Veli / yasal temsilci ad soyadını yazın.");
      }
      for (const key of MEDIA_PERMISSION_KEYS) {
        if (typeof mediaPermissions[key] !== "boolean") {
          throw new Error("Görsel izin matrisinin tüm kalemlerini doldurun.");
        }
      }

      const response = await fetch(`/api/v1/enrollments/${enrollmentId}/consents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthNote,
          consents: [
            {
              formType: "scientific",
              accepted: true,
              consentTextVersion: CONSENT_TEXT_VERSIONS.scientific,
              parentSignature,
            },
            {
              formType: "participation",
              accepted: true,
              consentTextVersion: CONSENT_TEXT_VERSIONS.participation,
              parentSignature,
            },
            {
              formType: "media",
              accepted: true,
              consentTextVersion: CONSENT_TEXT_VERSIONS.media,
              parentSignature,
              mediaPermissions,
            },
          ],
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Onaylar kaydedilemedi.");
      }

      setSuccess("Onaylar kaydedildi.");
      setStep(2);
      await loadState();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitIntakeAndMaybePreTest() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      for (const field of INTAKE_PREVIOUS_EXPERIENCE_FIELDS) {
        const value = previousExperience[field.id];
        if (field.multiple) {
          requireMulti(Array.isArray(value) ? value : [], field.label);
        } else {
          requireSingle(typeof value === "string" ? value : "", field.label);
        }
      }
      for (const field of INTAKE_TECH_ACCESS_FIELDS) {
        requireSingle(techAccess[field.id] ?? "", field.label);
      }
      for (const field of INTAKE_INTEREST_FIELDS) {
        requireMulti(interests[field.id] ?? [], field.label);
      }
      requireMulti(motivationReasons, "Bu eğitime katılma nedeniniz");
      if (motivationReasons.includes("Diğer") && !motivationOther.trim()) {
        throw new Error("“Diğer” seçildiğinde açıklama yazın.");
      }
      requireSingle(learnMost, INTAKE_OPEN_ENDED.learn_most);
      if (!allLikertAnswered(intakeLikert, INTAKE_LIKERT_QUESTIONS.map((q) => q.id))) {
        throw new Error("Tanıma formu Likert maddelerinin tümünü yanıtlayın.");
      }
      requireSingle(designWish, INTAKE_OPEN_ENDED.design_wish);
      requireSingle(expectation, INTAKE_OPEN_ENDED.expectation);

      const intakeResponse = await fetch(`/api/v1/enrollments/${enrollmentId}/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousExperience,
          techAccess,
          interests,
          motivation: { reasons: motivationReasons },
          motivationOther: motivationReasons.includes("Diğer") ? motivationOther : null,
          intakeLikert,
          openEnded: {
            learn_most: learnMost,
            design_wish: designWish,
            expectation,
          },
        }),
      });

      const intakePayload = (await intakeResponse.json()) as { error?: string };
      if (!intakeResponse.ok) {
        throw new Error(intakePayload.error ?? "Tanıma formu kaydedilemedi.");
      }

      const requiresSurveys = state?.requiresSurveys ?? false;

      if (requiresSurveys) {
        for (const dimension of TPS_SURVEY_DIMENSIONS) {
          if (
            !allLikertAnswered(
              preDimensions[dimension.key] ?? {},
              dimension.questions.map((question) => question.id),
            )
          ) {
            throw new Error(`Ön test — ${dimension.title} maddelerini yanıtlayın.`);
          }
        }
        requireSingle(preOpenEnded, PRE_TEST_OPEN_ENDED);
      }

      const preResponse = await fetch(`/api/v1/enrollments/${enrollmentId}/pre-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          requiresSurveys
            ? {
                survey: {
                  ...collectDimensions(preDimensions),
                  openEnded: preOpenEnded,
                },
              }
            : { skip: true },
        ),
      });

      const prePayload = (await preResponse.json()) as {
        error?: string;
        data?: { studentCode: string; skippedSurvey: boolean };
      };

      if (!preResponse.ok || !prePayload.data) {
        throw new Error(prePayload.error ?? "Ön test / öğrenci kodu işlemi başarısız.");
      }

      setSuccess(
        requiresSurveys
          ? `Ön test kaydedildi. Öğrenci kodunuz: ${prePayload.data.studentCode}`
          : `Formlar tamamlandı. Öğrenci kodunuz: ${prePayload.data.studentCode}`,
      );

      await loadState();
      if (requiresSurveys) {
        setStep(3);
      } else {
        setStep(4);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitPostTest() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      for (const dimension of TPS_SURVEY_DIMENSIONS) {
        if (
          !allLikertAnswered(
            postDimensions[dimension.key] ?? {},
            dimension.questions.map((question) => question.id),
          )
        ) {
          throw new Error(`Son test — ${dimension.title} maddelerini yanıtlayın.`);
        }
      }
      if (!allLikertAnswered(trainingImpact, TRAINING_IMPACT_QUESTIONS.map((q) => q.id))) {
        throw new Error("Eğitim etkisi maddelerini yanıtlayın.");
      }
      if (!allLikertAnswered(futureTrends, FUTURE_TRENDS_QUESTIONS.map((q) => q.id))) {
        throw new Error("Gelecek eğilim maddelerini yanıtlayın.");
      }
      requireSingle(favoriteActivity, POST_TEST_OPEN_ENDED.favorite_activity);
      requireSingle(mostImportantLearning, POST_TEST_OPEN_ENDED.most_important_learning);
      requireSingle(nextTopics, POST_TEST_OPEN_ENDED.next_topics);
      requireSingle(productIdea, POST_TEST_OPEN_ENDED.product_idea);

      const response = await fetch(`/api/v1/enrollments/${enrollmentId}/post-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...collectDimensions(postDimensions),
          openEnded: null,
          extra: {
            trainingImpact,
            futureTrends,
            openEnded: {
              favorite_activity: favoriteActivity,
              most_important_learning: mostImportantLearning,
              next_topics: nextTopics,
              product_idea: productIdea,
            },
          },
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Son test kaydedilemedi.");
      }

      setSuccess("Son test kaydedildi. Sertifika için admin onayı bekleniyor.");
      await loadState();
      setStep(4);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Formlar yükleniyor...
      </div>
    );
  }

  if (!state) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error ?? "Form durumu yüklenemedi."}
      </div>
    );
  }

  const onaylarDone = (["scientific", "media", "participation"] as const).every((type) =>
    state.consents.some((item) => item.formType === type && item.accepted),
  );
  const tanismaDone = Boolean(state.intakeFormCompletedAt) && Boolean(state.preTestCompletedAt);
  const sonTestDone = Boolean(state.postTestCompletedAt);
  const sertifikaDone = Boolean(state.hasActiveCertificate);

  const onaylarTone: StepTone = onaylarDone ? "done" : "action";
  const tanismaTone: StepTone = !onaylarDone ? "idle" : tanismaDone ? "done" : "action";
  const sonTestTone: StepTone = !tanismaDone
    ? "idle"
    : sonTestDone
      ? "done"
      : state.requiresSurveys
        ? "action"
        : "done";
  const sertifikaTone: StepTone = !sonTestDone ? "idle" : sertifikaDone ? "done" : "action";

  const wizardComplete = onaylarDone && tanismaDone && sonTestDone;

  const steps: Array<{ id: WizardStep; label: string; tone: StepTone; enabled: boolean }> = [
    { id: 1, label: "Onaylar", tone: onaylarTone, enabled: true },
    { id: 2, label: "Tanışma", tone: tanismaTone, enabled: onaylarDone },
    {
      id: 3,
      label: "Son test",
      tone: sonTestTone,
      enabled: tanismaDone && state.requiresSurveys,
    },
    {
      id: 4,
      label: "Sertifika onay",
      tone: sertifikaTone,
      enabled: sonTestDone || (!state.requiresSurveys && tanismaDone),
    },
  ];

  // For non-survey grades, son test pill still visible but auto-done after tanışma
  if (!state.requiresSurveys) {
    steps[2].enabled = tanismaDone;
    steps[2].tone = !tanismaDone ? "idle" : "done";
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Katılımcı Formları
        </p>
        <h1 className="mt-2 text-2xl font-black text-navy-950">{state.eventTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sınıf: {formatGradeLevel(state.gradeLevel)}
          {state.studentCode ? ` · Öğrenci kodu: ${state.studentCode}` : ""}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {steps.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={!item.enabled && item.tone === "idle"}
              onClick={() => {
                if (item.enabled || item.tone !== "idle") {
                  setStep(item.id);
                }
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${stepToneClass(
                item.tone,
                step === item.id,
              )}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Yeşil: tamamlandı · Kırmızı: doldurulmalı · Silik: henüz sırası gelmedi
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}
      {wizardComplete ? (
        <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Bu kayıt için zorunlu formlar tamamlandı.
        </p>
      ) : null}

      {step === 1 ? (
        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-navy-950">Onaylar</h2>
          <p className="text-sm text-slate-600">
            F05, F06 ve F07 metinlerini okuyun; ardından onay kutularını işaretleyin. (F04 uzman
            görüş formudur, öğrenci/veli akışında yer almaz.)
          </p>

          {CONSENT_DOCUMENTS.map((document) => (
            <div key={document.code} className="space-y-3">
              <ConsentDocumentCard document={document} />

              {document.code === "F05" ? (
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={scientificAccepted}
                    onChange={(e) => setScientificAccepted(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <strong>F05</strong> Bilimsel ölçüm / araştırma onay metnini okudum ve kabul
                    ediyorum.
                  </span>
                </label>
              ) : null}

              {document.code === "F06" ? (
                <>
                  <MediaConsentMatrix value={mediaPermissions} onChange={setMediaPermissions} />
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={mediaAccepted}
                      onChange={(e) => setMediaAccepted(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      <strong>F06</strong> Görsel / medya kullanım onay metnini okudum; yukarıdaki
                      matriste seçimlerimi yaptım.
                    </span>
                  </label>
                </>
              ) : null}

              {document.code === "F07" ? (
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={participationAccepted}
                    onChange={(e) => setParticipationAccepted(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <strong>F07</strong> Katılım ve güvenlik onay metnini okudum ve kabul ediyorum.
                  </span>
                </label>
              ) : null}
            </div>
          ))}

          <Input
            label="Veli / yasal temsilci ad soyad (dijital imza)"
            value={parentSignature}
            onChange={(e) => setParentSignature(e.target.value)}
            required
          />

          <Textarea
            label="Sağlık / özel durum notu (opsiyonel)"
            value={healthNote}
            onChange={(e) => setHealthNote(e.target.value)}
            rows={3}
          />

          <Button type="button" disabled={isSaving} onClick={() => void submitConsents()}>
            {isSaving ? "Kaydediliyor..." : "Onayları Kaydet ve Devam Et"}
          </Button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-navy-950">
            Tanışma (F01)
            {state.requiresSurveys ? " + Ön Test (F02)" : ""}
          </h2>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p>
              <strong>Ad Soyad:</strong> {state.profilePrefill.fullName || "—"}
            </p>
            <p className="mt-1">
              <strong>Cinsiyet:</strong> {formatGender(state.profilePrefill.gender)}
            </p>
            <p className="mt-1">
              <strong>Sınıf / Okul / İl-İlçe:</strong>{" "}
              {formatGradeLevel(state.profilePrefill.gradeLevel)} ·{" "}
              {state.profilePrefill.schoolName || "—"} · {state.profilePrefill.cityDistrict || "—"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Bölüm A profilinizden alınır. Güncellemek için Öğrenci Paneli → Profilim.
            </p>
          </div>

          <h3 className="pt-2 text-lg font-bold text-navy-950">Bölüm B — Önceki deneyim</h3>
          {INTAKE_PREVIOUS_EXPERIENCE_FIELDS.map((field) => (
            <OptionChipGroup
              key={field.id}
              label={field.label}
              options={field.options}
              multiple={field.multiple}
              value={
                field.multiple
                  ? ((previousExperience[field.id] as string[]) ?? [])
                  : ((previousExperience[field.id] as string) ?? "")
              }
              onChange={(value) =>
                setPreviousExperience((current) => ({ ...current, [field.id]: value }))
              }
            />
          ))}

          <h3 className="pt-2 text-lg font-bold text-navy-950">Bölüm C — Teknoloji erişimi</h3>
          {INTAKE_TECH_ACCESS_FIELDS.map((field) => (
            <OptionChipGroup
              key={field.id}
              label={field.label}
              options={field.options}
              value={techAccess[field.id] ?? ""}
              onChange={(value) =>
                setTechAccess((current) => ({ ...current, [field.id]: String(value) }))
              }
            />
          ))}

          <h3 className="pt-2 text-lg font-bold text-navy-950">Bölüm D — İlgi alanları</h3>
          {INTAKE_INTEREST_FIELDS.map((field) => (
            <OptionChipGroup
              key={field.id}
              label={field.label}
              options={field.options}
              multiple
              value={interests[field.id] ?? []}
              onChange={(value) =>
                setInterests((current) => ({
                  ...current,
                  [field.id]: Array.isArray(value) ? value : [String(value)],
                }))
              }
            />
          ))}

          <h3 className="pt-2 text-lg font-bold text-navy-950">Bölüm E — Motivasyon</h3>
          <OptionChipGroup
            label="Bu eğitime katılma nedeniniz nedir?"
            options={[...INTAKE_MOTIVATION_REASONS]}
            multiple
            value={motivationReasons}
            onChange={(value) => setMotivationReasons(Array.isArray(value) ? value : [value])}
          />
          {motivationReasons.includes("Diğer") ? (
            <Input
              label="Diğer (açıklayın)"
              value={motivationOther}
              onChange={(e) => setMotivationOther(e.target.value)}
            />
          ) : null}

          <Textarea
            label={INTAKE_OPEN_ENDED.learn_most}
            value={learnMost}
            onChange={(e) => setLearnMost(e.target.value)}
            rows={3}
          />

          <LikertScaleGroup
            title="Kendinizi değerlendirin (1–5)"
            questions={INTAKE_LIKERT_QUESTIONS}
            values={intakeLikert}
            onChange={(id, value) => setIntakeLikert((current) => ({ ...current, [id]: value }))}
          />

          <Textarea
            label={INTAKE_OPEN_ENDED.design_wish}
            value={designWish}
            onChange={(e) => setDesignWish(e.target.value)}
            rows={3}
          />
          <Textarea
            label={INTAKE_OPEN_ENDED.expectation}
            value={expectation}
            onChange={(e) => setExpectation(e.target.value)}
            rows={3}
          />

          {state.requiresSurveys ? (
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h3 className="text-lg font-bold text-navy-950">Ön Test (F02)</h3>
              {TPS_SURVEY_DIMENSIONS.map((dimension) => (
                <LikertScaleGroup
                  key={dimension.key}
                  title={dimension.title}
                  questions={dimension.questions}
                  values={preDimensions[dimension.key] ?? {}}
                  onChange={(id, value) =>
                    setPreDimensions((current) => ({
                      ...current,
                      [dimension.key]: { ...(current[dimension.key] ?? {}), [id]: value },
                    }))
                  }
                />
              ))}
              <Textarea
                label={PRE_TEST_OPEN_ENDED}
                value={preOpenEnded}
                onChange={(e) => setPreOpenEnded(e.target.value)}
                rows={3}
              />
            </div>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Sınıf düzeyiniz 5–8 dışında olduğu için ön test / son test atlanır; öğrenci kodu bu
              adımda üretilir.
            </p>
          )}

          <Button type="button" disabled={isSaving} onClick={() => void submitIntakeAndMaybePreTest()}>
            {isSaving ? "Kaydediliyor..." : "Kaydet ve Devam Et"}
          </Button>
        </section>
      ) : null}

      {step === 3 ? (
        state.requiresSurveys ? (
        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-navy-950">Son Test (F03)</h2>
          <p className="text-sm text-slate-600">
            Eğitim bitiminde doldurun. Tamamlanmadan admin sertifika veremez.
          </p>

          <h3 className="text-lg font-bold text-navy-950">Bölüm A — Ölçek maddeleri</h3>
          {TPS_SURVEY_DIMENSIONS.map((dimension) => (
            <LikertScaleGroup
              key={dimension.key}
              title={dimension.title}
              questions={dimension.questions}
              values={postDimensions[dimension.key] ?? {}}
              onChange={(id, value) =>
                setPostDimensions((current) => ({
                  ...current,
                  [dimension.key]: { ...(current[dimension.key] ?? {}), [id]: value },
                }))
              }
            />
          ))}

          <h3 className="text-lg font-bold text-navy-950">Bölüm B — Eğitim etkisi</h3>
          <LikertScaleGroup
            questions={TRAINING_IMPACT_QUESTIONS}
            values={trainingImpact}
            onChange={(id, value) => setTrainingImpact((current) => ({ ...current, [id]: value }))}
          />

          <h3 className="text-lg font-bold text-navy-950">Bölüm C — Gelecek eğilimler</h3>
          <LikertScaleGroup
            questions={FUTURE_TRENDS_QUESTIONS}
            values={futureTrends}
            onChange={(id, value) => setFutureTrends((current) => ({ ...current, [id]: value }))}
          />

          <h3 className="text-lg font-bold text-navy-950">Bölüm D — Açık uçlu</h3>
          <Textarea
            label={POST_TEST_OPEN_ENDED.favorite_activity}
            value={favoriteActivity}
            onChange={(e) => setFavoriteActivity(e.target.value)}
            rows={3}
          />
          <Textarea
            label={POST_TEST_OPEN_ENDED.most_important_learning}
            value={mostImportantLearning}
            onChange={(e) => setMostImportantLearning(e.target.value)}
            rows={3}
          />
          <Textarea
            label={POST_TEST_OPEN_ENDED.next_topics}
            value={nextTopics}
            onChange={(e) => setNextTopics(e.target.value)}
            rows={3}
          />
          <Textarea
            label={POST_TEST_OPEN_ENDED.product_idea}
            value={productIdea}
            onChange={(e) => setProductIdea(e.target.value)}
            rows={3}
          />

          <Button type="button" disabled={isSaving} onClick={() => void submitPostTest()}>
            {isSaving ? "Kaydediliyor..." : "Son Testi Kaydet"}
          </Button>
        </section>
        ) : (
          <section className="space-y-3 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-navy-950">Son Test</h2>
            <p className="text-sm text-emerald-900">
              Sınıf düzeyiniz 5–8 dışında olduğu için son test zorunlu değil; bu adım otomatik
              tamamlandı.
            </p>
          </section>
        )
      ) : null}

      {step === 4 ? (
        <section
          className={`space-y-3 rounded-[2rem] border p-6 shadow-sm ${
            sertifikaDone
              ? "border-emerald-200 bg-emerald-50"
              : sonTestDone
                ? "border-red-200 bg-red-50"
                : "border-slate-200 bg-slate-50"
          }`}
        >
          <h2 className="text-xl font-bold text-navy-950">Sertifika onay</h2>
          {sertifikaDone ? (
            <p className="text-sm text-emerald-900">
              Sertifikanız onaylandı ve oluşturuldu. Öğrenci panelindeki Sertifikalarım
              bölümünden indirebilirsiniz.
            </p>
          ) : sonTestDone ? (
            <p className="text-sm text-red-800">
              Formlarınız tamam. Sertifika için admin onayı bekleniyor. Onaylanınca burada yeşil
              görünecek.
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              Önceki adımları tamamladıktan sonra sertifika onayı burada görünecek.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
