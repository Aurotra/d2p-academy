import Link from "next/link";

import type { ParentOnboardingContext } from "@/infrastructure/repositories/fetch-parent-onboarding-context";
import { buttonLinkClasses } from "@/presentation/components/ui/button";

interface ParentOnboardingGuideProps {
  context: ParentOnboardingContext;
}

type StepStatus = "done" | "current" | "upcoming";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  href?: string;
  actionLabel?: string;
}

function resolveSteps(context: ParentOnboardingContext): OnboardingStep[] {
  const hasChild = context.childrenCount > 0;
  const profileComplete = !hasChild || context.firstChildProfileComplete;
  const hasEnrollment = context.childEnrollmentCount > 0;
  const formsPending = context.pendingFormsEnrollment !== null;
  const hasEvents = context.upcomingEventsCount > 0;

  const childStatus: StepStatus = hasChild ? "done" : "current";
  const profileStatus: StepStatus = !hasChild
    ? "upcoming"
    : profileComplete
      ? "done"
      : "current";
  const eventsStatus: StepStatus = !profileComplete
    ? "upcoming"
    : hasEnrollment
      ? "done"
      : "current";
  const enrollStatus: StepStatus = !profileComplete
    ? "upcoming"
    : hasEnrollment
      ? "done"
      : "upcoming";
  const formsStatus: StepStatus = !hasEnrollment
    ? "upcoming"
    : formsPending
      ? "current"
      : "done";

  const profileHref = context.firstChildId
    ? `/dashboard/children/${context.firstChildId}/profile`
    : "/dashboard/children?add=1";

  const steps: OnboardingStep[] = [
    {
      id: "child",
      title: "Çocuk hesabı ekleyin",
      description:
        "Etkinliğe kayıt çocuğunuzun kullanıcı adlı öğrenci hesabı üzerinden yapılır. Veli panelinden birkaç dakikada ekleyebilirsiniz.",
      status: childStatus,
      href: "/dashboard/children?add=1",
      actionLabel: "Çocuk ekle",
    },
    {
      id: "profile",
      title: "Çocuk profilini doldurun",
      description:
        "Sınıf, okul, veli telefon numarası ve ilgi alanları gibi bilgiler katılımcı formları ve sertifika süreci için gereklidir. Veli hesabınızı değil, çocuğunuzun profilini %100 tamamlayın.",
      status: profileStatus,
      href: profileHref,
      actionLabel: "Profili doldur",
    },
    {
      id: "events",
      title: hasEvents ? "Aktif etkinliklere göz atın" : "Uygun etkinlikleri kontrol edin",
      description: hasEvents
        ? "Yayınlanmış etkinliklerden size uygun tarihi seçin; kayıt için çocuk hesabı ve profil hazır olmalıdır."
        : "Şu an kayda açık etkinlik görünmüyor. Takvimi kontrol edin veya kurs talebi bırakın.",
      status: eventsStatus,
      href: hasEvents ? "/etkinlikler" : "/dashboard/kurs-talebi",
      actionLabel: hasEvents ? "Etkinlikleri gör" : "Kurs talebi oluştur",
    },
    {
      id: "enroll",
      title: "Çocuğu etkinliğe kaydedin",
      description:
        "Çocuk hesapları sayfasında «Etkinliğe kaydet» ile program seçin. Kayıt sonrası katılımcı formları açılır.",
      status: enrollStatus,
      href: "/dashboard/children?enroll=1",
      actionLabel: "Etkinliğe kaydet",
    },
    {
      id: "forms",
      title: "Katılımcı formlarını doldurun",
      description:
        "Tanışma ve onay formlarını etkinlik öncesi tamamlayın; ön test (F02) tüm sınıf düzeylerinde tanışma adımında. Son test (F03) yalnızca 2–8. sınıflarda, etkinlik/yoklama sonrası açılır.",
      status: formsStatus,
      href: context.pendingFormsEnrollment
        ? `/dashboard/children/${context.pendingFormsEnrollment.childId}/enrollments/${context.pendingFormsEnrollment.enrollmentId}/forms`
        : "/dashboard/children",
      actionLabel: "Formlara git",
    },
  ];

  return steps;
}

function StepIndicator({ status, index }: { status: StepStatus; index: number }) {
  if (status === "done") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
        ✓
      </span>
    );
  }

  if (status === "current") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-document-primary text-sm font-bold text-white ring-4 ring-document-primary/20">
        {index + 1}
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border-surface bg-white text-sm font-bold text-subtle">
      {index + 1}
    </span>
  );
}

export function ParentOnboardingGuide({ context }: ParentOnboardingGuideProps) {
  const steps = resolveSteps(context);
  const currentStep = steps.find((step) => step.status === "current") ?? steps[0];
  const completedCount = steps.filter((step) => step.status === "done").length;

  return (
    <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-surface-section p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            Başlangıç rehberi
          </p>
          <h2 className="mt-2 text-2xl font-bold text-navy-950">
            {context.childrenCount === 0
              ? "Önce çocuk hesabı ekleyelim"
              : context.childEnrollmentCount === 0
                ? "Çocuğunuzu etkinliğe kaydetmeye hazırlanalım"
                : "Kayıt tamam — formları bitirmeniz gerekiyor"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Veli hesabı yalnızca panel erişimi içindir. Etkinlik kaydı ve formlar çocuğunuzun
            hesabı üzerinden ilerler; aşağıdaki sırayı takip edin.
          </p>
          <p className="mt-3 text-xs font-medium text-subtle">
            {completedCount}/{steps.length} adım tamamlandı
          </p>
        </div>

        {currentStep.href && currentStep.actionLabel ? (
          <Link
            href={currentStep.href}
            className={buttonLinkClasses("primary", "w-full shrink-0 sm:w-auto")}
          >
            {currentStep.actionLabel}
          </Link>
        ) : null}
      </div>

      <ol className="mt-8 space-y-4">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`rounded-2xl border p-4 transition ${
              step.status === "current"
                ? "border-document-primary/30 bg-white shadow-sm ring-1 ring-document-primary/10"
                : step.status === "done"
                  ? "border-emerald-100 bg-emerald-50/40"
                  : "border-border-surface bg-white/70"
            }`}
          >
            <div className="flex gap-4">
              <StepIndicator status={step.status} index={index} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`font-semibold ${
                      step.status === "upcoming" ? "text-subtle" : "text-navy-950"
                    }`}
                  >
                    {step.title}
                  </h3>
                  {step.status === "current" ? (
                    <span className="rounded-full bg-document-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-document-primary">
                      Şimdi
                    </span>
                  ) : null}
                </div>
                <p
                  className={`mt-1 text-sm leading-6 ${
                    step.status === "upcoming" ? "text-subtle" : "text-muted"
                  }`}
                >
                  {step.description}
                </p>
                {step.status === "current" && step.href && step.actionLabel ? (
                  <Link
                    href={step.href}
                    className="mt-3 inline-flex text-sm font-semibold text-document-primary hover:underline"
                  >
                    {step.actionLabel} →
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-xs text-subtle">
        Detaylı anlatım için{" "}
        <Link href="/veli-rehberi" className="font-semibold text-document-primary hover:underline">
          veli rehberine
        </Link>{" "}
        göz atabilirsiniz.
      </p>
    </div>
  );
}
