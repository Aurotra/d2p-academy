import Link from "next/link";
import { Suspense } from "react";

import type { StudentDashboardData, EnrollmentStatus } from "@/core/domain/student-dashboard";
import { EVENT_TYPE_LABELS } from "@/core/domain/event";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import { Badge } from "@/presentation/components/ui/badge";
import { DashboardEnrollHandler } from "@/presentation/components/dashboard/dashboard-enroll-handler";

interface DashboardViewProps {
  data: StudentDashboardData;
  isAdmin: boolean;
  isInstructor: boolean;
}

type DashboardActionVariant = "secondary" | "accent" | "document" | "outline";

const dashboardActionClasses: Record<DashboardActionVariant, string> = {
  secondary:
    "border border-secondary/20 bg-secondary text-white shadow-md shadow-secondary/20 hover:bg-secondary-hover hover:shadow-glow-secondary",
  accent:
    "border border-accent-dark/20 bg-accent text-sky-950 shadow-md shadow-accent/20 hover:bg-accent-dark hover:shadow-glow-accent",
  document:
    "border border-document-primary/20 bg-document-primary text-white shadow-md shadow-document-primary/20 hover:bg-document-primary-hover hover:shadow-glow-document",
  outline:
    "border-2 border-sky-300/80 bg-white/90 text-sky-950 shadow-sm hover:border-sky-400 hover:bg-white",
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
      className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${dashboardActionClasses[variant]}`}
    >
      {label}
    </Link>
  );
}

const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
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

export function DashboardView({ data, isAdmin, isInstructor }: DashboardViewProps) {
  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={null}>
          <DashboardEnrollHandler />
        </Suspense>

        <div
          className={`rounded-[2rem] border border-sky-200 ${BRAND_SURFACE_GRADIENT} p-6 text-sky-950 shadow-xl sm:p-8`}
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Veli Paneli
                </p>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-primary-hover"
                  >
                    Admin
                  </Link>
                ) : null}
                {isInstructor ? (
                  <Link
                    href="/instructor"
                    className="inline-flex items-center justify-center rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-violet-700"
                  >
                    Eğitmen
                  </Link>
                ) : null}
              </div>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                Hoş geldin, {data.profile.fullName?.trim().split(/\s+/)[0] || "veli"}!
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-sky-900/80 sm:text-base">
                Yaklaşan etkinliklerini ve kazandığın sertifikaları buradan takip edebilirsin.
              </p>
            </div>

            <div className="w-full shrink-0 lg:max-w-md">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky-800/70">
                Hızlı erişim
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <DashboardActionLink
                  href="/dashboard/children"
                  label="Çocuk hesapları"
                  variant="secondary"
                />
                <DashboardActionLink
                  href="/dashboard/kurs-talebi"
                  label="Kurs talebi"
                  variant="accent"
                />
                <DashboardActionLink href="/dashboard/profile" label="Profilim" variant="outline" />
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

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy-950">Etkinlik Kayıtlarım</h2>
              <Badge tone="cyan">{data.upcomingEnrollments.length} kayıt</Badge>
            </div>

            {data.upcomingEnrollments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                <p>Aktif etkinlik kaydın bulunmuyor.</p>
                <Link
                  href="/#events"
                  className="mt-3 inline-flex font-semibold text-document-primary hover:underline"
                >
                  Ana sayfadaki takvimden etkinliğe kaydol →
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {data.upcomingEnrollments.map((enrollment) => (
                  <li
                    key={enrollment.id}
                    className="rounded-2xl border border-slate-100 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="cyan">{EVENT_TYPE_LABELS[enrollment.event.eventType]}</Badge>
                      <Badge tone="neutral">
                        {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-semibold text-navy-950">{enrollment.event.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {formatDate(enrollment.event.startAt)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
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

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy-950">Sertifikalarım</h2>
              <Badge tone="navy">{data.certificates.length} sertifika</Badge>
            </div>

            {data.certificates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                Henüz sertifikan bulunmuyor. Eğitimlerini tamamladığında sertifikaların burada
                listelenecek.
              </div>
            ) : (
              <ul className="space-y-4">
                {data.certificates.map((certificate) => (
                  <li
                    key={certificate.id}
                    className="rounded-2xl border border-slate-100 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/40"
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
                    <p className="mt-2 text-sm text-slate-600">
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
                      <p className="mt-3 text-xs text-slate-500">
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
