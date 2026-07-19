import type { ReactNode } from "react";

import type {
  ConsentFormType,
  EnrollmentFormAnswers,
  SurveyAnswerSnapshot,
} from "@/core/domain/participant-forms";
import { MEDIA_PERMISSION_KEYS } from "@/core/domain/participant-forms";
import {
  CONSENT_DOCUMENTS,
  FUTURE_TRENDS_QUESTIONS,
  INTAKE_INTEREST_FIELDS,
  INTAKE_LIKERT_QUESTIONS,
  INTAKE_OPEN_ENDED,
  INTAKE_PREVIOUS_EXPERIENCE_FIELDS,
  INTAKE_TECH_ACCESS_FIELDS,
  MEDIA_PERMISSION_LABELS,
  PARTICIPANT_LIKERT_OPTIONS,
  POST_TEST_OPEN_ENDED,
  PRE_TEST_OPEN_ENDED,
  TPS_SURVEY_DIMENSIONS,
  TRAINING_IMPACT_QUESTIONS,
} from "@/shared/constants/participant-forms";
import { GRADE_LEVEL_OPTIONS } from "@/shared/constants/profile-options";

interface AdminEnrollmentFormsViewProps {
  answers: EnrollmentFormAnswers;
}

const CONSENT_LABELS: Record<ConsentFormType, string> = {
  scientific: "F05 — Bilimsel ölçüm / araştırma",
  media: "F06 — Görsel / medya kullanımı",
  participation: "F07 — Katılım ve güvenlik",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function formatGradeLevel(value: string | null | undefined): string {
  if (!value) return "belirtilmemiş";
  return GRADE_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function formatAnswer(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(String).join(", ") : "—";
  }
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (typeof value === "object") {
    const reasons = (value as { reasons?: unknown }).reasons;
    if (Array.isArray(reasons)) {
      return reasons.length > 0 ? reasons.map(String).join(", ") : "—";
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function formatLikert(value: number | undefined): string {
  if (typeof value !== "number") return "—";
  return PARTICIPANT_LIKERT_OPTIONS.find((option) => option.value === value)?.label ?? String(value);
}

function dimensionValues(
  survey: SurveyAnswerSnapshot,
  key: (typeof TPS_SURVEY_DIMENSIONS)[number]["key"],
): Record<string, number> {
  switch (key) {
    case "dimension_1":
      return survey.dimensions.dimension1;
    case "dimension_2":
      return survey.dimensions.dimension2;
    case "dimension_3":
      return survey.dimensions.dimension3;
    case "dimension_4":
      return survey.dimensions.dimension4;
    case "dimension_5":
      return survey.dimensions.dimension5;
  }
}

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string | null;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {meta ? <p className="mt-1 text-xs text-slate-500">{meta}</p> : null}
      </div>
      {children}
    </section>
  );
}

function AnswerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-slate-500">{message}</p>;
}

function SurveyScaleAnswers({
  survey,
  openEndedLabel,
}: {
  survey: SurveyAnswerSnapshot;
  openEndedLabel?: string;
}) {
  return (
    <div className="space-y-4">
      {TPS_SURVEY_DIMENSIONS.map((dimension) => {
        const values = dimensionValues(survey, dimension.key);
        return (
          <div key={dimension.key} className="space-y-2">
            <h3 className="text-sm font-bold text-navy-950">{dimension.title}</h3>
            {dimension.questions.map((question) => (
              <AnswerRow
                key={question.id}
                label={question.label}
                value={formatLikert(values[question.id])}
              />
            ))}
          </div>
        );
      })}
      {openEndedLabel ? (
        <AnswerRow label={openEndedLabel} value={formatAnswer(survey.openEnded)} />
      ) : null}
    </div>
  );
}

export function AdminEnrollmentFormsView({ answers }: AdminEnrollmentFormsViewProps) {
  const consentOrder: ConsentFormType[] = ["scientific", "media", "participation"];
  const consentsByType = new Map(answers.consents.map((item) => [item.formType, item]));

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Tanışma: {answers.intake ? "Dolduruldu" : "Yok"}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Onaylar: {answers.consents.some((item) => item.accepted) ? "Var" : "Yok"}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Ön test:{" "}
            {answers.preTest ? "Dolduruldu" : answers.requiresSurveys ? "Yok" : "Gerekmiyor"}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Son test:{" "}
            {answers.postTest ? "Dolduruldu" : answers.requiresSurveys ? "Yok" : "Gerekmiyor"}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Sınıf: {formatGradeLevel(answers.gradeLevel)}
          </span>
          {answers.studentCode ? (
            <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-800">
              Kod: {answers.studentCode}
            </span>
          ) : null}
        </div>
      </div>

      <Section title="Onaylar (F05–F07)">
        {answers.consents.length === 0 ? (
          <EmptyState message="Henüz onay kaydı yok." />
        ) : (
          <div className="space-y-4">
            {consentOrder.map((type) => {
              const consent = consentsByType.get(type);
              const document = CONSENT_DOCUMENTS.find((item) => item.formType === type);
              if (!consent) {
                return (
                  <AnswerRow key={type} label={CONSENT_LABELS[type]} value="Kaydedilmemiş" />
                );
              }
              return (
                <div key={type} className="space-y-2 rounded-2xl border border-slate-100 p-4">
                  <p className="font-semibold text-slate-900">
                    {document ? `${document.code} — ${document.title}` : CONSENT_LABELS[type]}
                  </p>
                  <AnswerRow
                    label="Durum"
                    value={
                      consent.accepted
                        ? `Kabul edildi · ${formatDate(consent.acceptedAt)}`
                        : "Kabul edilmedi"
                    }
                  />
                  <AnswerRow
                    label="Veli / yasal temsilci imzası"
                    value={formatAnswer(consent.parentSignature)}
                  />
                  {consent.formType === "media" && consent.mediaPermissions ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Medya izin matrisi
                      </p>
                      {MEDIA_PERMISSION_KEYS.map((key) => (
                        <AnswerRow
                          key={key}
                          label={MEDIA_PERMISSION_LABELS[key]}
                          value={consent.mediaPermissions?.[key] ? "İzin verildi" : "İzin yok"}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <AnswerRow
              label="Sağlık / özel durum notu"
              value={answers.healthNote?.trim() ? answers.healthNote : "Belirtilmemiş"}
            />
          </div>
        )}
      </Section>

      <Section
        title="Tanışma (F01)"
        meta={answers.intake ? `Kayıt: ${formatDate(answers.intake.submittedAt)}` : null}
      >
        {!answers.intake ? (
          <EmptyState message="Tanışma formu henüz doldurulmamış." />
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-navy-950">Önceki deneyim</h3>
            {INTAKE_PREVIOUS_EXPERIENCE_FIELDS.map((field) => (
              <AnswerRow
                key={field.id}
                label={field.label}
                value={formatAnswer(answers.intake?.previousExperience[field.id])}
              />
            ))}

            <h3 className="text-sm font-bold text-navy-950">Teknoloji erişimi</h3>
            {INTAKE_TECH_ACCESS_FIELDS.map((field) => (
              <AnswerRow
                key={field.id}
                label={field.label}
                value={formatAnswer(answers.intake?.techAccess[field.id])}
              />
            ))}

            <h3 className="text-sm font-bold text-navy-950">İlgi alanları</h3>
            {INTAKE_INTEREST_FIELDS.map((field) => (
              <AnswerRow
                key={field.id}
                label={field.label}
                value={formatAnswer(answers.intake?.interests[field.id])}
              />
            ))}

            <AnswerRow
              label="Bu eğitime katılma nedeniniz"
              value={formatAnswer(answers.intake.motivation)}
            />
            {answers.intake.motivationOther ? (
              <AnswerRow label="Diğer (açıklama)" value={answers.intake.motivationOther} />
            ) : null}

            <h3 className="text-sm font-bold text-navy-950">Likert maddeleri</h3>
            {INTAKE_LIKERT_QUESTIONS.map((question) => (
              <AnswerRow
                key={question.id}
                label={question.label}
                value={formatLikert(answers.intake?.intakeLikert[question.id])}
              />
            ))}

            <h3 className="text-sm font-bold text-navy-950">Açık uçlu</h3>
            <AnswerRow
              label={INTAKE_OPEN_ENDED.learn_most}
              value={formatAnswer(answers.intake.openEnded.learn_most)}
            />
            <AnswerRow
              label={INTAKE_OPEN_ENDED.design_wish}
              value={formatAnswer(answers.intake.openEnded.design_wish)}
            />
            <AnswerRow
              label={INTAKE_OPEN_ENDED.expectation}
              value={formatAnswer(answers.intake.openEnded.expectation)}
            />
          </div>
        )}
      </Section>

      <Section
        title="Ön Test (F02)"
        meta={
          answers.preTest
            ? `Gönderim: ${formatDate(answers.preTest.submittedAt)}`
            : answers.preTestCompletedAt
              ? `Tamamlanma: ${formatDate(answers.preTestCompletedAt)} (anket atlanmış olabilir)`
              : null
        }
      >
        {!answers.requiresSurveys ? (
          <EmptyState message="Bu sınıf düzeyinde ön test zorunlu değil." />
        ) : !answers.preTest ? (
          <EmptyState message="Ön test henüz doldurulmamış." />
        ) : (
          <SurveyScaleAnswers survey={answers.preTest} openEndedLabel={PRE_TEST_OPEN_ENDED} />
        )}
      </Section>

      <Section
        title="Son Test (F03)"
        meta={answers.postTest ? `Gönderim: ${formatDate(answers.postTest.submittedAt)}` : null}
      >
        {!answers.requiresSurveys ? (
          <EmptyState message="Bu sınıf düzeyinde son test zorunlu değil." />
        ) : !answers.postTest ? (
          <EmptyState message="Son test henüz doldurulmamış." />
        ) : (
          <div className="space-y-4">
            <SurveyScaleAnswers survey={answers.postTest} />
            {answers.postTestExtra ? (
              <>
                <h3 className="text-sm font-bold text-navy-950">Eğitim etkisi</h3>
                {TRAINING_IMPACT_QUESTIONS.map((question) => (
                  <AnswerRow
                    key={question.id}
                    label={question.label}
                    value={formatLikert(answers.postTestExtra?.trainingImpact[question.id])}
                  />
                ))}
                <h3 className="text-sm font-bold text-navy-950">Gelecek eğilimler</h3>
                {FUTURE_TRENDS_QUESTIONS.map((question) => (
                  <AnswerRow
                    key={question.id}
                    label={question.label}
                    value={formatLikert(answers.postTestExtra?.futureTrends[question.id])}
                  />
                ))}
                <h3 className="text-sm font-bold text-navy-950">Açık uçlu</h3>
                <AnswerRow
                  label={POST_TEST_OPEN_ENDED.favorite_activity}
                  value={formatAnswer(answers.postTestExtra.openEnded.favorite_activity)}
                />
                <AnswerRow
                  label={POST_TEST_OPEN_ENDED.most_important_learning}
                  value={formatAnswer(answers.postTestExtra.openEnded.most_important_learning)}
                />
                <AnswerRow
                  label={POST_TEST_OPEN_ENDED.next_topics}
                  value={formatAnswer(answers.postTestExtra.openEnded.next_topics)}
                />
                <AnswerRow
                  label={POST_TEST_OPEN_ENDED.product_idea}
                  value={formatAnswer(answers.postTestExtra.openEnded.product_idea)}
                />
              </>
            ) : null}
          </div>
        )}
      </Section>
    </div>
  );
}
