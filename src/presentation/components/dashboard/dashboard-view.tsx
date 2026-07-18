import Link from "next/link";
import { Suspense } from "react";

import type { StudentDashboardData, EnrollmentStatus } from "@/core/domain/student-dashboard";
import { EVENT_TYPE_LABELS } from "@/core/domain/event";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import { Badge } from "@/presentation/components/ui/badge";
import { DashboardEnrollHandler } from "@/presentation/components/dashboard/dashboard-enroll-handler";
import { LogoutButton } from "@/presentation/components/dashboard/logout-button";

interface DashboardViewProps {
  data: StudentDashboardData;
  isAdmin: boolean;
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

export function DashboardView({ data, isAdmin }: DashboardViewProps) {
  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={null}>
          <DashboardEnrollHandler />
        </Suspense>

        <div
          className={`flex flex-col gap-4 rounded-[2rem] border border-sky-200 ${BRAND_SURFACE_GRADIENT} p-8 text-sky-950 shadow-xl sm:flex-row sm:items-center sm:justify-between`}
        >
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                Öğrenci Paneli
              </p>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover hover:shadow-glow-primary"
                >
                  Admin Paneli
                </Link>
              ) : null}
            </div>
            <h1 className="mt-2 text-3xl font-black">
              Hoş geldin, {data.profile.fullName.split(" ")[0]}!
            </h1>
            <p className="mt-2 text-sm text-sky-900/80">
              Yaklaşan etkinliklerini ve kazandığın sertifikaları buradan takip edebilirsin.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center justify-center rounded-xl border-2 border-document-primary bg-white px-5 py-3 text-sm font-semibold text-document-primary transition hover:bg-document-primary/5"
            >
              Profilim
            </Link>
            <Link
              href="/dashboard/documents"
              className="inline-flex items-center justify-center rounded-xl bg-document-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-document-primary-hover hover:shadow-glow-document"
            >
              Dökümanlar
            </Link>
            <Link
              href="/dashboard/report"
              className="inline-flex items-center justify-center rounded-xl border-2 border-document-primary bg-white px-5 py-3 text-sm font-semibold text-document-primary transition hover:bg-document-primary/5"
            >
              Not Raporum
            </Link>
            <LogoutButton />
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
