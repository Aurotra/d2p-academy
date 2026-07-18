"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  EnrollmentFormProgress,
  MediaPermissions,
  SurveyDimensionsInput,
} from "@/core/domain/participant-forms";
import { MEDIA_PERMISSION_KEYS } from "@/core/domain/participant-forms";
import { LikertScaleGroup } from "@/presentation/components/forms/likert-scale-group";
import { MediaConsentMatrix } from "@/presentation/components/forms/media-consent-matrix";
import { ConsentDocumentCard } from "@/presentation/components/forms/consent-document-card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";
import {
  CONSENT_DOCUMENTS,
  CONSENT_TEXT_VERSIONS,
  EMPTY_MEDIA_PERMISSIONS,
  INTAKE_LIKERT_QUESTIONS,
  POST_TEST_DIMENSIONS,
  PRE_TEST_DIMENSIONS,
} from "@/shared/constants/participant-forms";

interface CourseApplicationWizardProps {
  enrollmentId: string;
}

type WizardStep = 1 | 2 | 3;

function emptyLikert(ids: string[]): Record<string, number> {
  return Object.fromEntries(ids.map((id) => [id, 0]));
}

function allLikertAnswered(values: Record<string, number>, ids: string[]): boolean {
  return ids.every((id) => typeof values[id] === "number" && values[id] >= 1 && values[id] <= 5);
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

  const [codingExperience, setCodingExperience] = useState("");
  const [hasComputer, setHasComputer] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [motivationGoal, setMotivationGoal] = useState("");
  const [motivationOther, setMotivationOther] = useState("");
  const [intakeLikert, setIntakeLikert] = useState(() =>
    emptyLikert(INTAKE_LIKERT_QUESTIONS.map((q) => q.id)),
  );
  const [intakeOpenEnded, setIntakeOpenEnded] = useState("");

  const [preDimensions, setPreDimensions] = useState<Record<string, Record<string, number>>>(() => ({
    dimension_1: emptyLikert(PRE_TEST_DIMENSIONS.dimension_1.map((q) => q.id)),
    dimension_2: emptyLikert(PRE_TEST_DIMENSIONS.dimension_2.map((q) => q.id)),
    dimension_3: emptyLikert(PRE_TEST_DIMENSIONS.dimension_3.map((q) => q.id)),
    dimension_4: emptyLikert(PRE_TEST_DIMENSIONS.dimension_4.map((q) => q.id)),
    dimension_5: emptyLikert(PRE_TEST_DIMENSIONS.dimension_5.map((q) => q.id)),
  }));
  const [preOpenEnded, setPreOpenEnded] = useState("");

  const [postDimensions, setPostDimensions] = useState<Record<string, Record<string, number>>>(
    () => ({
      dimension_1: emptyLikert(POST_TEST_DIMENSIONS.dimension_1.map((q) => q.id)),
      dimension_2: emptyLikert(POST_TEST_DIMENSIONS.dimension_2.map((q) => q.id)),
      dimension_3: emptyLikert(POST_TEST_DIMENSIONS.dimension_3.map((q) => q.id)),
      dimension_4: emptyLikert(POST_TEST_DIMENSIONS.dimension_4.map((q) => q.id)),
      dimension_5: emptyLikert(POST_TEST_DIMENSIONS.dimension_5.map((q) => q.id)),
    }),
  );
  const [postOpenEnded, setPostOpenEnded] = useState("");
  const [trainingImpact, setTrainingImpact] = useState("");
  const [futureTrends, setFutureTrends] = useState("");

  const interestOptions = useMemo(
    () =>
      state?.profilePrefill.interests?.length
        ? state.profilePrefill.interests
        : ["3D Tasarım", "3D Baskı", "Maker", "Mühendislik", "Kodlama"],
    [state],
  );

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

      const experience = next.profilePrefill.experienceData;
      if (typeof experience.coding_experience === "string") {
        setCodingExperience(experience.coding_experience);
      }
      setSelectedInterests(next.profilePrefill.interests ?? []);
      const motivation = next.profilePrefill.motivationData;
      if (typeof motivation.hedef === "string") {
        setMotivationGoal(motivation.hedef);
      }

      if (!next.consents.some((item) => item.accepted)) {
        setStep(1);
      } else if (!next.intakeFormCompletedAt) {
        setStep(2);
      } else if (next.requiresSurveys && !next.preTestCompletedAt) {
        setStep(2);
      } else if (next.requiresSurveys && !next.postTestCompletedAt) {
        setStep(3);
      } else {
        setStep(next.requiresSurveys ? 3 : 2);
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
      if (!allLikertAnswered(intakeLikert, INTAKE_LIKERT_QUESTIONS.map((q) => q.id))) {
        throw new Error("Tanıma formu Likert maddelerinin tümünü yanıtlayın.");
      }

      const intakeResponse = await fetch(`/api/v1/enrollments/${enrollmentId}/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousExperience: { coding_experience: codingExperience },
          techAccess: { has_computer: hasComputer },
          interests: { selected: selectedInterests },
          motivation: { goal: motivationGoal },
          motivationOther,
          intakeLikert,
          openEnded: { note: intakeOpenEnded },
        }),
      });

      const intakePayload = (await intakeResponse.json()) as { error?: string };
      if (!intakeResponse.ok) {
        throw new Error(intakePayload.error ?? "Tanıma formu kaydedilemedi.");
      }

      const requiresSurveys = state?.requiresSurveys ?? false;

      if (requiresSurveys) {
        for (const [key, questions] of Object.entries(PRE_TEST_DIMENSIONS)) {
          if (!allLikertAnswered(preDimensions[key] ?? {}, questions.map((q) => q.id))) {
            throw new Error("Ön testin tüm maddelerini yanıtlayın.");
          }
        }
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
      for (const [key, questions] of Object.entries(POST_TEST_DIMENSIONS)) {
        if (!allLikertAnswered(postDimensions[key] ?? {}, questions.map((q) => q.id))) {
          throw new Error("Son testin tüm maddelerini yanıtlayın.");
        }
      }

      const response = await fetch(`/api/v1/enrollments/${enrollmentId}/post-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...collectDimensions(postDimensions),
          openEnded: postOpenEnded,
          extra: {
            trainingImpact: { summary: trainingImpact },
            futureTrends: { summary: futureTrends },
            openEnded: { note: postOpenEnded },
          },
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Son test kaydedilemedi.");
      }

      setSuccess("Son test kaydedildi. Sertifika için admin onayı bekleniyor.");
      await loadState();
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

  const wizardComplete =
    Boolean(state.intakeFormCompletedAt) &&
    Boolean(state.preTestCompletedAt) &&
    (!state.requiresSurveys || Boolean(state.postTestCompletedAt));

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Katılımcı Formları
        </p>
        <h1 className="mt-2 text-2xl font-black text-navy-950">{state.eventTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sınıf: {state.gradeLevel || "belirtilmemiş"}
          {state.studentCode ? ` · Öğrenci kodu: ${state.studentCode}` : ""}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {[1, 2, 3].map((value) => {
            if (value === 3 && !state.requiresSurveys) return null;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setStep(value as WizardStep)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  step === value
                    ? "bg-document-primary text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                Adım {value}
              </button>
            );
          })}
        </div>
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
          <h2 className="text-xl font-bold text-navy-950">Adım 1 — Onaylar</h2>
          <p className="text-sm text-slate-600">
            Aşağıdaki F04, F05 ve F06 metinlerini okuyun; ardından ilgili onay kutularını
            işaretleyin.
          </p>

          {CONSENT_DOCUMENTS.map((document) => (
            <ConsentDocumentCard key={document.code} document={document} />
          ))}

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={participationAccepted}
              onChange={(e) => setParticipationAccepted(e.target.checked)}
              className="mt-1"
            />
            <span>
              <strong>F04</strong> Katılım ve güvenlik onay metnini okudum ve kabul ediyorum.
            </span>
          </label>

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

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={mediaAccepted}
              onChange={(e) => setMediaAccepted(e.target.checked)}
              className="mt-1"
            />
            <span>
              <strong>F06</strong> Görsel / medya kullanım onay metnini okudum; aşağıdaki matriste
              seçimlerimi yaptım.
            </span>
          </label>

          <MediaConsentMatrix value={mediaPermissions} onChange={setMediaPermissions} />

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
          <h2 className="text-xl font-bold text-navy-950">Adım 2 — Tanıma Formu {state.requiresSurveys ? "+ Ön Test" : ""}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Önceki deneyim (kodlama / tasarım)"
              value={codingExperience}
              onChange={(e) => setCodingExperience(e.target.value)}
              placeholder="none / beginner / intermediate / advanced"
            />
            <Input
              label="Bilgisayar / tablet erişimi"
              value={hasComputer}
              onChange={(e) => setHasComputer(e.target.value)}
              placeholder="evet / hayır / kısmen"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-900">İlgi alanları</p>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => {
                const selected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      selected
                        ? "bg-document-primary text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                    onClick={() =>
                      setSelectedInterests((current) =>
                        selected
                          ? current.filter((item) => item !== interest)
                          : [...current, interest],
                      )
                    }
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            label="Motivasyon / hedef"
            value={motivationGoal}
            onChange={(e) => setMotivationGoal(e.target.value)}
            rows={3}
          />
          <Input
            label="Diğer motivasyon (opsiyonel)"
            value={motivationOther}
            onChange={(e) => setMotivationOther(e.target.value)}
          />

          <LikertScaleGroup
            title="Tanıma Likert (F01)"
            questions={INTAKE_LIKERT_QUESTIONS}
            values={intakeLikert}
            onChange={(id, value) => setIntakeLikert((current) => ({ ...current, [id]: value }))}
          />

          <Textarea
            label="Açık uçlu not"
            value={intakeOpenEnded}
            onChange={(e) => setIntakeOpenEnded(e.target.value)}
            rows={3}
          />

          {state.requiresSurveys ? (
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h3 className="text-lg font-bold text-navy-950">Adım 2.3 — Ön Test (F02)</h3>
              {Object.entries(PRE_TEST_DIMENSIONS).map(([key, questions], index) => (
                <LikertScaleGroup
                  key={key}
                  title={`Boyut ${index + 1}`}
                  questions={questions}
                  values={preDimensions[key] ?? {}}
                  onChange={(id, value) =>
                    setPreDimensions((current) => ({
                      ...current,
                      [key]: { ...(current[key] ?? {}), [id]: value },
                    }))
                  }
                />
              ))}
              <Textarea
                label="Ön test açık uçlu"
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

      {step === 3 && state.requiresSurveys ? (
        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-navy-950">Adım 3 — Son Test (F03)</h2>
          <p className="text-sm text-slate-600">
            Eğitim bitiminde doldurun. Tamamlanmadan admin sertifika veremez.
          </p>

          {Object.entries(POST_TEST_DIMENSIONS).map(([key, questions], index) => (
            <LikertScaleGroup
              key={key}
              title={`Boyut ${index + 1}`}
              questions={questions}
              values={postDimensions[key] ?? {}}
              onChange={(id, value) =>
                setPostDimensions((current) => ({
                  ...current,
                  [key]: { ...(current[key] ?? {}), [id]: value },
                }))
              }
            />
          ))}

          <Textarea
            label="Eğitimin etkisi"
            value={trainingImpact}
            onChange={(e) => setTrainingImpact(e.target.value)}
            rows={3}
          />
          <Textarea
            label="Gelecek eğilimler / devam isteği"
            value={futureTrends}
            onChange={(e) => setFutureTrends(e.target.value)}
            rows={3}
          />
          <Textarea
            label="Açık uçlu"
            value={postOpenEnded}
            onChange={(e) => setPostOpenEnded(e.target.value)}
            rows={3}
          />

          <Button type="button" disabled={isSaving} onClick={() => void submitPostTest()}>
            {isSaving ? "Kaydediliyor..." : "Son Testi Kaydet"}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
