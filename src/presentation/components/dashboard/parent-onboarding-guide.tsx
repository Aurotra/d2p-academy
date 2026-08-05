import Link from "next/link";

import type { ParentOnboardingContext } from "@/infrastructure/repositories/fetch-parent-onboarding-context";
import { Button } from "@/presentation/components/ui/button";

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
  const hasEnrollment = context.childEnrollmentCount > 0;
  const formsPending = context.pendingFormsEnrollment !== null;
  const hasEvents = context.upcomingEventsCount > 0;

  const browseStatus: StepStatus = hasEnrollment ? "done" : hasChild ? "done" : "current";
  const childStatus: StepStatus = !hasChild
    ? hasEnrollment
      ? "done"
      : browseStatus === "current"
        ? "upcoming"
        : "current"
    : "done";
  const enrollStatus: StepStatus = !hasEnrollment
    ? hasChild
      ? "current"
      : "upcoming"
    : "done";
  const formsStatus: StepStatus = !hasEnrollment
    ? "upcoming"
    : formsPending
      ? "current"
      : "done";

  const steps: OnboardingStep[] = [
    {
      id: "events",
      title: hasEvents ? "Aktif etkinliklere göz atın" : "Uygun etkinlikleri kontrol edin",
      description: hasEvents
        ? "Yayınlanmış etkinliklerden size uygun tarihi seçin; kayıt için önce çocuk hesabı gerekir."
        : "Şu an kayda açık etkinlik görünmüyor. Takvimi kontrol edin veya kurs talebi bırakın.",
      status: browseStatus,
      href: hasEvents ? "/etkinlikler" : "/dashboard/kurs-talebi",
      actionLabel: hasEvents ? "Etkinlikleri gör" : "Kurs talebi oluştur",
    },
    {
      id: "child",
      title: "Çocuk hesabı ekleyin",
      description:
        "Etkinliğe kayıt, çocuğunuzun kullanıcı adlı öğrenci hesabı üzerinden yapılır. Veli panelinden birkaç dakikada ekleyebilirsiniz.",
      status: childStatus,
      href: "/dashboard/children?add=1",
      actionLabel: "Çocuk ekle",
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
        "Tanışma ve onay formlarını tamamlayın; gerekirse ön/son test adımlarını bitirin. Etkinlik gününe hazır olun.",
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
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-sm font-bold text-slate-400">
      {index + 1}
    </span>
  );
}

export function ParentOnboardingGuide({ context }: ParentOnboardingGuideProps) {
  const steps = resolveSteps(context);
  const currentStep = steps.find((step) => step.status === "current") ?? steps[0];
  const completedCount = steps.filter((step) => step.status === "done").length;

  return (
    <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            Başlangıç rehberi
          </p>
          <h2 className="mt-2 text-2xl font-bold text-navy-950">
            {context.childEnrollmentCount === 0
              ? "İlk etkinlik kaydınızı birlikte tamamlayalım"
              : "Kayıt tamam — formları bitirmeniz gerekiyor"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            D2P Academy&apos;de asıl adım çocuğunuzu uygun etkinliğe kaydetmektir. Aşağıdaki
            sırayı takip edin; her adım bir sonrakine hazırlar.
          </p>
          <p className="mt-3 text-xs font-medium text-slate-500">
            {completedCount}/{steps.length} adım tamamlandı
          </p>
        </div>

        {currentStep.href && currentStep.actionLabel ? (
          <Link href={currentStep.href} className="shrink-0">
            <Button type="button" className="w-full sm:w-auto">
              {currentStep.actionLabel}
            </Button>
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
                  : "border-slate-100 bg-white/70"
            }`}
          >
            <div className="flex gap-4">
              <StepIndicator status={step.status} index={index} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`font-semibold ${
                      step.status === "upcoming" ? "text-slate-500" : "text-navy-950"
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
                    step.status === "upcoming" ? "text-slate-400" : "text-slate-600"
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

      <p className="mt-6 text-xs text-slate-500">
        Detaylı anlatım için{" "}
        <Link href="/veli-rehberi" className="font-semibold text-document-primary hover:underline">
          veli rehberine
        </Link>{" "}
        göz atabilirsiniz.
      </p>
    </div>
  );
}
