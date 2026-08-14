import Link from "next/link";
import { Suspense } from "react";

import type { StudentDashboardData, EnrollmentStatus } from "@/core/domain/student-dashboard";
import type { ParentChildEnrollmentItem } from "@/core/domain/parent-children-enrollments";
import type { ParentOnboardingContext } from "@/infrastructure/repositories/fetch-parent-onboarding-context";
import { EVENT_TYPE_LABELS } from "@/core/domain/event";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import { Badge } from "@/presentation/components/ui/badge";
import { DashboardEnrollHandler } from "@/presentation/components/dashboard/dashboard-enroll-handler";
import { ParentOnboardingGuide } from "@/presentation/components/dashboard/parent-onboarding-guide";
import {
  PanelShortcutGroup,
  PanelShortcutLink,
} from "@/presentation/components/dashboard/panel-shortcut-link";

interface DashboardViewProps {
  data: StudentDashboardData;
  childrenEnrollments: ParentChildEnrollmentItem[];
  isAdmin: boolean;
  isInstructor: boolean;
  onboardingContext: ParentOnboardingContext;
  showOnboarding: boolean;
}

type DashboardActionVariant = "secondary" | "accent" | "document" | "outline";

const dashboardActionClasses: Record<DashboardActionVariant, string> = {
  secondary:
    "border border-secondary/20 bg-secondary text-white shadow-md shadow-secondary/20 hover:bg-secondary-hover hover:shadow-glow-secondary",
  accent:
    "border border-accent-dark/20 bg-accent text-navy-950 shadow-md shadow-accent/20 hover:bg-accent-dark hover:shadow-glow-accent",
  document:
    "border border-document-primary/20 bg-document-primary text-white shadow-md shadow-document-primary/20 hover:bg-document-primary-hover hover:shadow-glow-document",
  outline:
    "border-2 border-secondary/40 bg-white/90 text-navy-950 shadow-sm hover:border-secondary hover:bg-white",
};

function DashboardActionLink({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: DashboardActionVariant;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2 ${dashboardActionClasses[variant]}`}
    >
      {label}
    </Link>
  );
}

const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending_payment: "Ödeme bekleniyor",
  registered: "Kayıtlı",
  attended: "Katıldı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

export function DashboardView({
  data,
  childrenEnrollments,
  isAdmin,
  isInstructor,
  onboardingContext,
  showOnboarding,
}: DashboardViewProps) {
  return (
    <section className="bg-surface-section px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={null}>
          <DashboardEnrollHandler />
        </Suspense>

        <div
          className={`rounded-[2rem] border border-border-surface ${BRAND_SURFACE_GRADIENT} p-6 text-navy-950 shadow-xl sm:p-8`}
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start gap-3">
                <p className="pt-2 text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
                  Veli Paneli
                </p>
                {isAdmin || isInstructor ? (
                  <PanelShortcutGroup>
                    {isAdmin ? (
                      <PanelShortcutLink
                        href="/admin"
                        title="Admin"
                        caption="Admin paneline git"
                        variant="admin"
                      />
                    ) : null}
                    {isInstructor ? (
                      <PanelShortcutLink
                        href="/instructor"
                        title="Eğitmen"
                        caption="Eğitmen paneline git"
                        variant="instructor"
                      />
                    ) : null}
                  </PanelShortcutGroup>
                ) : null}
              </div>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                Hoş geldin, {data.profile.fullName?.trim().split(/\s+/)[0] || "veli"}!
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-on-surface-soft)] sm:text-base">
                {showOnboarding
                  ? "Çocuk hesaplarını yönetin; etkinlik kaydı ve formlar çocuğunuzun profili üzerinden ilerler."
                  : "Çocuklarınızın etkinlik kayıtlarını ve sertifikalarını buradan takip edebilirsiniz."}
              </p>
            </div>

            <div className="w-full shrink-0 lg:max-w-md">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-navy-900/70">
                Hızlı erişim
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <DashboardActionLink
                  href="/dashboard/children/enrollments"
                  label="Çocuk etkinlikleri"
                  variant="secondary"
                />
                <DashboardActionLink
                  href="/dashboard/payments"
                  label="Ödemelerim"
                  variant="outline"
                />
                <DashboardActionLink
                  href="/dashboard/children"
                  label="Çocuk hesapları"
                  variant="outline"
                />
                <DashboardActionLink
                  href="/dashboard/kurs-talebi"
                  label="Kurs talebi"
                  variant="accent"
                />
                <DashboardActionLink
                  href="/dashboard/children?add=1"
                  label="Çocuk ekle"
                  variant="outline"
                />
                <DashboardActionLink
                  href="/dashboard/documents"
                  label="Dökümanlar"
                  variant="document"
                />
                <DashboardActionLink
                  href="/dashboard/report"
                  label="Not Raporum"
                  variant="outline"
                />
              </div>
            </div>
          </div>
        </div>

        {showOnboarding ? (
          <div className="mt-8">
            <ParentOnboardingGuide context={onboardingContext} />
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-navy-950">Etkinlik Kayıtlarım</h2>
              <Badge tone="cyan">{data.upcomingEnrollments.length} kayıt</Badge>
            </div>
            <p className="mb-4 text-xs text-subtle">
              Veli hesabınıza doğrudan bağlı kayıtlar. Çocuk kayıtları için yanındaki panele
              bakın.
            </p>

            {data.upcomingEnrollments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-surface bg-surface-section px-4 py-8 text-center text-sm text-muted">
                <p>Veli hesabınıza bağlı aktif etkinlik kaydı yok.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {data.upcomingEnrollments.map((enrollment) => (
                  <li
                    key={enrollment.id}
                    className="rounded-2xl border border-border-surface p-4 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="cyan">{EVENT_TYPE_LABELS[enrollment.event.eventType]}</Badge>
                      <Badge tone="neutral">
                        {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-semibold text-navy-950">{enrollment.event.title}</h3>
                    <p className="mt-2 text-sm text-muted">
                      {formatDate(enrollment.event.startAt)}
                    </p>
                    <p className="mt-1 text-sm text-subtle">
                      {enrollment.event.isOnline
                        ? "Online etkinlik"
                        : (enrollment.event.locationName ?? "Konum belirtilecek")}
                    </p>
                    <Link
                      href={`/dashboard/enrollments/${enrollment.id}/forms`}
                      className="mt-3 inline-flex text-sm font-semibold text-document-primary hover:underline"
                    >
                      Katılımcı formlarını doldur →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-navy-950">Çocuklarımın Etkinlikleri</h2>
              <Badge tone="navy">{childrenEnrollments.length} kayıt</Badge>
            </div>

            {childrenEnrollments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-surface bg-surface-section px-4 py-8 text-center text-sm text-muted">
                <p>Henüz çocuk etkinlik kaydı yok.</p>
                <Link
                  href="/dashboard/children"
                  className="mt-3 inline-flex font-semibold text-document-primary hover:underline"
                >
                  Çocuk hesaplarından kayıt oluştur →
                </Link>
              </div>
            ) : (
              <>
                <ul className="space-y-4">
                  {childrenEnrollments.slice(0, 4).map((enrollment) => (
                    <li
                      key={enrollment.enrollmentId}
                      className="rounded-2xl border border-border-surface p-4 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                    >
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="cyan">{EVENT_TYPE_LABELS[enrollment.eventType]}</Badge>
                        <Badge tone="neutral">
                          {ENROLLMENT_STATUS_LABELS[enrollment.status as EnrollmentStatus] ??
                            enrollment.status}
                        </Badge>
                      </div>
                      <h3 className="mt-3 font-semibold text-navy-950">{enrollment.eventTitle}</h3>
                      <p className="mt-1 text-sm text-muted">
                        {enrollment.childName}{" "}
                        <span className="text-subtle">@{enrollment.childUsername}</span>
                      </p>
                      <p className="mt-2 text-sm text-subtle">
                        Katılım {enrollment.presentCount}/{enrollment.totalLessonCount}
                      </p>
                      <Link
                        href={`/dashboard/children/${enrollment.childId}/enrollments/${enrollment.enrollmentId}/forms`}
                        className="mt-3 inline-flex text-sm font-semibold text-document-primary hover:underline"
                      >
                        Formları doldur →
                      </Link>
                    </li>
                  ))}
                </ul>
                {childrenEnrollments.length > 4 ? (
                  <p className="mt-4 text-xs text-subtle">
                    +{childrenEnrollments.length - 4} kayıt daha
                  </p>
                ) : null}
              </>
            )}

            <Link
              href="/dashboard/children/enrollments"
              className="mt-6 inline-flex text-sm font-semibold text-document-primary hover:underline"
            >
              Tüm çocuk etkinliklerini gör →
            </Link>
          </div>

          <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy-950">Sertifikalarım</h2>
              <Badge tone="navy">{data.certificates.length} sertifika</Badge>
            </div>

            {data.certificates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-surface bg-surface-section px-4 py-8 text-center text-sm text-muted">
                Henüz sertifikan bulunmuyor. Eğitimlerini tamamladığında sertifikaların burada
                listelenecek.
              </div>
            ) : (
              <ul className="space-y-4">
                {data.certificates.map((certificate) => (
                  <li
                    key={certificate.id}
                    className="rounded-2xl border border-border-surface p-4 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-sm font-bold text-navy-950">
                        {certificate.certificateCode}
                      </p>
                      <Badge tone={certificate.status === "active" ? "cyan" : "neutral"}>
                        {certificate.status === "active" ? "Aktif" : "İptal"}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-semibold text-navy-950">{certificate.eventTitle}</h3>
                    <p className="mt-2 text-sm text-muted">
                      Veriliş: {formatDate(certificate.issuedAt)}
                    </p>
                    {certificate.status === "active" && certificate.pdfUrl ? (
                      <a
                        href={certificate.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex text-sm font-semibold text-cyan-700 underline hover:text-cyan-900"
                      >
                        PDF İndir
                      </a>
                    ) : certificate.status === "active" ? (
                      <p className="mt-3 text-xs text-subtle">
                        PDF henüz hazır değil. Kısa süre sonra tekrar kontrol edin.
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
