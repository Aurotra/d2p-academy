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
  INTAKE_MOTIVATION_REASONS,
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

function toSelectedList(value: unknown): string[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "object") {
    const reasons = (value as { reasons?: unknown }).reasons;
    if (Array.isArray(reasons)) return reasons.map(String).filter(Boolean);
  }
  return [String(value)];
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
    <section
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm"
    >
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
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function OptionChip({ label, selected }: { label: string; selected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-bold ${
        selected
          ? "border-emerald-600 bg-emerald-100 text-emerald-950"
          : "border-rose-300 bg-rose-100 text-rose-900"
      }`}
    >
      <span aria-hidden>{selected ? "✓" : "×"}</span>
      {label}
    </span>
  );
}

function ChoiceOptions({
  options,
  selected,
}: {
  options: readonly string[];
  selected: string | string[] | unknown;
}) {
  const selectedSet = new Set(toSelectedList(selected));
  const known = new Set(options);
  const extras = toSelectedList(selected).filter((item) => !known.has(item));

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <OptionChip key={option} label={option} selected={selectedSet.has(option)} />
      ))}
      {extras.map((option) => (
        <OptionChip key={`extra-${option}`} label={option} selected />
      ))}
      {selectedSet.size === 0 ? (
        <span className="text-sm font-semibold text-slate-500">Cevap seçilmemiş</span>
      ) : null}
    </div>
  );
}

function LikertOptions({ value }: { value: number | undefined }) {
  const selected = typeof value === "number" && value >= 1 && value <= 5 ? value : null;

  return (
    <div className="flex flex-wrap gap-2">
      {PARTICIPANT_LIKERT_OPTIONS.map((option) => (
        <OptionChip
          key={option.value}
          label={option.label}
          selected={selected === option.value}
        />
      ))}
      {selected == null ? (
        <span className="text-sm font-semibold text-slate-500">Cevap seçilmemiş</span>
      ) : null}
    </div>
  );
}

function QuestionBlock({
  question,
  children,
}: {
  question: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-sm font-semibold leading-snug text-navy-950">{question}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function TextAnswer({ value }: { value: string }) {
  const text = value.trim();
  if (!text) {
    return <p className="text-sm font-semibold text-slate-500">Cevap yok</p>;
  }
  return (
    <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold whitespace-pre-wrap text-emerald-950">
      <span className="mr-1.5" aria-hidden>
        ✓
      </span>
      {text}
    </p>
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
              <QuestionBlock key={question.id} question={question.label}>
                <LikertOptions value={values[question.id]} />
              </QuestionBlock>
            ))}
          </Subsection>
        );
      })}
      {openEndedLabel ? (
        <Subsection title="Açık uçlu">
          <QuestionBlock question={openEndedLabel}>
            <TextAnswer value={survey.openEnded ?? ""} />
          </QuestionBlock>
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

        <nav
          className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4"
          aria-label="Form bölümleri"
        >
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
                  <QuestionBlock question="Durum">
                    <ChoiceOptions
                      options={["Kabul edildi", "Kabul edilmedi"]}
                      selected={consent.accepted ? "Kabul edildi" : "Kabul edilmedi"}
                    />
                    {consent.accepted ? (
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Tarih: {formatDate(consent.acceptedAt)}
                      </p>
                    ) : null}
                  </QuestionBlock>
                  <QuestionBlock question="Veli / yasal temsilci imzası">
                    <TextAnswer value={consent.parentSignature?.trim() || ""} />
                  </QuestionBlock>
                  {consent.formType === "media" && consent.mediaPermissions ? (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-sm font-black text-navy-950">Medya izin matrisi</p>
                      {MEDIA_PERMISSION_KEYS.map((key) => (
                        <QuestionBlock key={key} question={MEDIA_PERMISSION_LABELS[key]}>
                          <ChoiceOptions
                            options={["İzin verildi", "İzin yok"]}
                            selected={
                              consent.mediaPermissions?.[key] ? "İzin verildi" : "İzin yok"
                            }
                          />
                        </QuestionBlock>
                      ))}
                    </div>
                  ) : null}
                </Subsection>
              );
            })}

            <Subsection title="Sağlık / özel durum">
              <QuestionBlock question="Not">
                <TextAnswer value={answers.healthNote?.trim() || ""} />
              </QuestionBlock>
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
                <QuestionBlock key={field.id} question={field.label}>
                  <ChoiceOptions
                    options={field.options}
                    selected={answers.intake?.previousExperience[field.id]}
                  />
                </QuestionBlock>
              ))}
            </Subsection>

            <Subsection title="Teknoloji erişimi">
              {INTAKE_TECH_ACCESS_FIELDS.map((field) => (
                <QuestionBlock key={field.id} question={field.label}>
                  <ChoiceOptions
                    options={field.options}
                    selected={answers.intake?.techAccess[field.id]}
                  />
                </QuestionBlock>
              ))}
            </Subsection>

            <Subsection title="İlgi alanları">
              {INTAKE_INTEREST_FIELDS.map((field) => (
                <QuestionBlock key={field.id} question={field.label}>
                  <ChoiceOptions
                    options={field.options}
                    selected={answers.intake?.interests[field.id]}
                  />
                </QuestionBlock>
              ))}
            </Subsection>

            <Subsection title="Motivasyon">
              <QuestionBlock question="Bu eğitime katılma nedeniniz">
                <ChoiceOptions
                  options={[...INTAKE_MOTIVATION_REASONS]}
                  selected={answers.intake.motivation}
                />
              </QuestionBlock>
              {answers.intake.motivationOther ? (
                <QuestionBlock question="Diğer (açıklama)">
                  <TextAnswer value={answers.intake.motivationOther} />
                </QuestionBlock>
              ) : null}
            </Subsection>

            <Subsection title="Likert maddeleri">
              {INTAKE_LIKERT_QUESTIONS.map((question) => (
                <QuestionBlock key={question.id} question={question.label}>
                  <LikertOptions value={answers.intake?.intakeLikert[question.id]} />
                </QuestionBlock>
              ))}
            </Subsection>

            <Subsection title="Açık uçlu">
              <QuestionBlock question={INTAKE_OPEN_ENDED.learn_most}>
                <TextAnswer value={String(answers.intake.openEnded.learn_most ?? "")} />
              </QuestionBlock>
              <QuestionBlock question={INTAKE_OPEN_ENDED.design_wish}>
                <TextAnswer value={String(answers.intake.openEnded.design_wish ?? "")} />
              </QuestionBlock>
              <QuestionBlock question={INTAKE_OPEN_ENDED.expectation}>
                <TextAnswer value={String(answers.intake.openEnded.expectation ?? "")} />
              </QuestionBlock>
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
                    <QuestionBlock key={question.id} question={question.label}>
                      <LikertOptions
                        value={answers.postTestExtra?.trainingImpact[question.id]}
                      />
                    </QuestionBlock>
                  ))}
                </Subsection>
                <Subsection title="Gelecek eğilimler">
                  {FUTURE_TRENDS_QUESTIONS.map((question) => (
                    <QuestionBlock key={question.id} question={question.label}>
                      <LikertOptions value={answers.postTestExtra?.futureTrends[question.id]} />
                    </QuestionBlock>
                  ))}
                </Subsection>
                <Subsection title="Açık uçlu">
                  <QuestionBlock question={POST_TEST_OPEN_ENDED.favorite_activity}>
                    <TextAnswer
                      value={String(answers.postTestExtra.openEnded.favorite_activity ?? "")}
                    />
                  </QuestionBlock>
                  <QuestionBlock question={POST_TEST_OPEN_ENDED.most_important_learning}>
                    <TextAnswer
                      value={String(
                        answers.postTestExtra.openEnded.most_important_learning ?? "",
                      )}
                    />
                  </QuestionBlock>
                  <QuestionBlock question={POST_TEST_OPEN_ENDED.next_topics}>
                    <TextAnswer
                      value={String(answers.postTestExtra.openEnded.next_topics ?? "")}
                    />
                  </QuestionBlock>
                  <QuestionBlock question={POST_TEST_OPEN_ENDED.product_idea}>
                    <TextAnswer
                      value={String(answers.postTestExtra.openEnded.product_idea ?? "")}
                    />
                  </QuestionBlock>
                </Subsection>
              </>
            ) : null}
          </div>
        )}
      </FormSection>
    </div>
  );
}
