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

function StatusChip({
  label,
  state,
}: {
  label: string;
  state: "done" | "missing" | "skip" | "info";
}) {
  const styles = {
    done: "border-emerald-300 bg-emerald-50 text-emerald-900",
    missing: "border-rose-300 bg-rose-50 text-rose-900",
    skip: "border-slate-300 bg-slate-100 text-slate-700",
    info: "border-sky-300 bg-sky-50 text-sky-950",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-bold ${styles[state]}`}
    >
      {label}
    </span>
  );
}

function FormSection({
  id,
  code,
  title,
  meta,
  children,
}: {
  id: string;
  code: string;
  title: string;
  meta?: string | null;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <header className="border-b border-slate-300 bg-navy-950 px-5 py-4 text-white sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">{code}</p>
            <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{title}</h2>
          </div>
          {meta ? <p className="text-sm font-medium text-sky-100">{meta}</p> : null}
        </div>
      </header>
      <div className="space-y-6 p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 border-b-2 border-document-primary/30 pb-2">
        <span className="h-5 w-1.5 rounded-full bg-document-primary" aria-hidden />
        <h3 className="text-base font-black text-navy-950">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function QaRow({ question, answer }: { question: string; answer: ReactNode }) {
  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:gap-4">
      <p className="text-sm font-medium leading-snug text-slate-700">{question}</p>
      <div className="text-base font-bold leading-snug text-navy-950 sm:text-right">{answer}</div>
    </div>
  );
}

function LikertScore({ value }: { value: number | undefined }) {
  if (typeof value !== "number" || value < 1 || value > 5) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="inline-flex items-center gap-2 sm:justify-end">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={`h-2.5 w-2.5 rounded-sm ${
              step <= value ? "bg-document-primary" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <span className="tabular-nums text-document-primary">{value}/5</span>
    </div>
  );
}

function YesNoBadge({ yes }: { yes: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-sm font-bold ${
        yes ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"
      }`}
    >
      {yes ? "Evet" : "Hayır"}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-600">
      {message}
    </p>
  );
}

function SurveyScaleAnswers({
  survey,
  openEndedLabel,
}: {
  survey: SurveyAnswerSnapshot;
  openEndedLabel?: string;
}) {
  return (
    <div className="space-y-6">
      {TPS_SURVEY_DIMENSIONS.map((dimension) => {
        const values = dimensionValues(survey, dimension.key);
        return (
          <Subsection key={dimension.key} title={dimension.title}>
            {dimension.questions.map((question) => (
              <QaRow
                key={question.id}
                question={question.label}
                answer={<LikertScore value={values[question.id]} />}
              />
            ))}
          </Subsection>
        );
      })}
      {openEndedLabel ? (
        <Subsection title="Açık uçlu">
          <QaRow question={openEndedLabel} answer={formatAnswer(survey.openEnded)} />
        </Subsection>
      ) : null}
    </div>
  );
}

export function AdminEnrollmentFormsView({ answers }: AdminEnrollmentFormsViewProps) {
  const consentOrder: ConsentFormType[] = ["scientific", "media", "participation"];
  const consentsByType = new Map(answers.consents.map((item) => [item.formType, item]));
  const consentsDone = answers.consents.some((item) => item.accepted);

  const navItems = [
    { id: "forms-consents", label: "Onaylar" },
    { id: "forms-intake", label: "Tanışma" },
    { id: "forms-pre", label: "Ön test" },
    { id: "forms-post", label: "Son test" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-document-primary">
          Form durumu
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusChip
            label={`Tanışma · ${answers.intake ? "Dolduruldu" : "Eksik"}`}
            state={answers.intake ? "done" : "missing"}
          />
          <StatusChip
            label={`Onaylar · ${consentsDone ? "Var" : "Yok"}`}
            state={consentsDone ? "done" : "missing"}
          />
          <StatusChip
            label={`Ön test · ${
              answers.preTest ? "Dolduruldu" : answers.requiresSurveys ? "Eksik" : "Gerekmiyor"
            }`}
            state={answers.preTest ? "done" : answers.requiresSurveys ? "missing" : "skip"}
          />
          <StatusChip
            label={`Son test · ${
              answers.postTest ? "Dolduruldu" : answers.requiresSurveys ? "Eksik" : "Gerekmiyor"
            }`}
            state={answers.postTest ? "done" : answers.requiresSurveys ? "missing" : "skip"}
          />
          <StatusChip label={`Sınıf · ${formatGradeLevel(answers.gradeLevel)}`} state="info" />
          {answers.studentCode ? (
            <StatusChip label={`Kod · ${answers.studentCode}`} state="info" />
          ) : null}
        </div>

        <nav className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4" aria-label="Form bölümleri">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="rounded-lg bg-navy-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-document-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <FormSection id="forms-consents" code="F05 · F06 · F07" title="Onaylar">
        {answers.consents.length === 0 ? (
          <EmptyState message="Henüz onay kaydı yok." />
        ) : (
          <div className="space-y-5">
            {consentOrder.map((type) => {
              const consent = consentsByType.get(type);
              const document = CONSENT_DOCUMENTS.find((item) => item.formType === type);
              const heading = document
                ? `${document.code} — ${document.title}`
                : CONSENT_LABELS[type];

              if (!consent) {
                return (
                  <Subsection key={type} title={heading}>
                    <EmptyState message="Kaydedilmemiş" />
                  </Subsection>
                );
              }

              return (
                <Subsection key={type} title={heading}>
                  <QaRow
                    question="Durum"
                    answer={
                      consent.accepted ? (
                        <span className="text-emerald-800">
                          Kabul edildi
                          <span className="mt-1 block text-sm font-semibold text-slate-600 sm:text-right">
                            {formatDate(consent.acceptedAt)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-rose-800">Kabul edilmedi</span>
                      )
                    }
                  />
                  <QaRow
                    question="Veli / yasal temsilci imzası"
                    answer={formatAnswer(consent.parentSignature)}
                  />
                  {consent.formType === "media" && consent.mediaPermissions ? (
                    <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-black text-navy-950">Medya izin matrisi</p>
                      {MEDIA_PERMISSION_KEYS.map((key) => (
                        <QaRow
                          key={key}
                          question={MEDIA_PERMISSION_LABELS[key]}
                          answer={<YesNoBadge yes={Boolean(consent.mediaPermissions?.[key])} />}
                        />
                      ))}
                    </div>
                  ) : null}
                </Subsection>
              );
            })}

            <Subsection title="Sağlık / özel durum">
              <QaRow
                question="Not"
                answer={answers.healthNote?.trim() ? answers.healthNote : "Belirtilmemiş"}
              />
            </Subsection>
          </div>
        )}
      </FormSection>

      <FormSection
        id="forms-intake"
        code="F01"
        title="Tanışma"
        meta={answers.intake ? `Kayıt: ${formatDate(answers.intake.submittedAt)}` : null}
      >
        {!answers.intake ? (
          <EmptyState message="Tanışma formu henüz doldurulmamış." />
        ) : (
          <div className="space-y-6">
            <Subsection title="Önceki deneyim">
              {INTAKE_PREVIOUS_EXPERIENCE_FIELDS.map((field) => (
                <QaRow
                  key={field.id}
                  question={field.label}
                  answer={formatAnswer(answers.intake?.previousExperience[field.id])}
                />
              ))}
            </Subsection>

            <Subsection title="Teknoloji erişimi">
              {INTAKE_TECH_ACCESS_FIELDS.map((field) => (
                <QaRow
                  key={field.id}
                  question={field.label}
                  answer={formatAnswer(answers.intake?.techAccess[field.id])}
                />
              ))}
            </Subsection>

            <Subsection title="İlgi alanları">
              {INTAKE_INTEREST_FIELDS.map((field) => (
                <QaRow
                  key={field.id}
                  question={field.label}
                  answer={formatAnswer(answers.intake?.interests[field.id])}
                />
              ))}
            </Subsection>

            <Subsection title="Motivasyon">
              <QaRow
                question="Bu eğitime katılma nedeniniz"
                answer={formatAnswer(answers.intake.motivation)}
              />
              {answers.intake.motivationOther ? (
                <QaRow question="Diğer (açıklama)" answer={answers.intake.motivationOther} />
              ) : null}
            </Subsection>

            <Subsection title="Likert maddeleri">
              {INTAKE_LIKERT_QUESTIONS.map((question) => (
                <QaRow
                  key={question.id}
                  question={question.label}
                  answer={<LikertScore value={answers.intake?.intakeLikert[question.id]} />}
                />
              ))}
            </Subsection>

            <Subsection title="Açık uçlu">
              <QaRow
                question={INTAKE_OPEN_ENDED.learn_most}
                answer={formatAnswer(answers.intake.openEnded.learn_most)}
              />
              <QaRow
                question={INTAKE_OPEN_ENDED.design_wish}
                answer={formatAnswer(answers.intake.openEnded.design_wish)}
              />
              <QaRow
                question={INTAKE_OPEN_ENDED.expectation}
                answer={formatAnswer(answers.intake.openEnded.expectation)}
              />
            </Subsection>
          </div>
        )}
      </FormSection>

      <FormSection
        id="forms-pre"
        code="F02"
        title="Ön Test"
        meta={
          answers.preTest
            ? `Gönderim: ${formatDate(answers.preTest.submittedAt)}`
            : answers.preTestCompletedAt
              ? `Tamamlanma: ${formatDate(answers.preTestCompletedAt)}`
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
      </FormSection>

      <FormSection
        id="forms-post"
        code="F03"
        title="Son Test"
        meta={answers.postTest ? `Gönderim: ${formatDate(answers.postTest.submittedAt)}` : null}
      >
        {!answers.requiresSurveys ? (
          <EmptyState message="Bu sınıf düzeyinde son test zorunlu değil." />
        ) : !answers.postTest ? (
          <EmptyState message="Son test henüz doldurulmamış." />
        ) : (
          <div className="space-y-6">
            <SurveyScaleAnswers survey={answers.postTest} />
            {answers.postTestExtra ? (
              <>
                <Subsection title="Eğitim etkisi">
                  {TRAINING_IMPACT_QUESTIONS.map((question) => (
                    <QaRow
                      key={question.id}
                      question={question.label}
                      answer={
                        <LikertScore value={answers.postTestExtra?.trainingImpact[question.id]} />
                      }
                    />
                  ))}
                </Subsection>
                <Subsection title="Gelecek eğilimler">
                  {FUTURE_TRENDS_QUESTIONS.map((question) => (
                    <QaRow
                      key={question.id}
                      question={question.label}
                      answer={
                        <LikertScore value={answers.postTestExtra?.futureTrends[question.id]} />
                      }
                    />
                  ))}
                </Subsection>
                <Subsection title="Açık uçlu">
                  <QaRow
                    question={POST_TEST_OPEN_ENDED.favorite_activity}
                    answer={formatAnswer(answers.postTestExtra.openEnded.favorite_activity)}
                  />
                  <QaRow
                    question={POST_TEST_OPEN_ENDED.most_important_learning}
                    answer={formatAnswer(
                      answers.postTestExtra.openEnded.most_important_learning,
                    )}
                  />
                  <QaRow
                    question={POST_TEST_OPEN_ENDED.next_topics}
                    answer={formatAnswer(answers.postTestExtra.openEnded.next_topics)}
                  />
                  <QaRow
                    question={POST_TEST_OPEN_ENDED.product_idea}
                    answer={formatAnswer(answers.postTestExtra.openEnded.product_idea)}
                  />
                </Subsection>
              </>
            ) : null}
          </div>
        )}
      </FormSection>
    </div>
  );
}
