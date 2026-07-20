import Link from "next/link";

import type {
  BadgeSummary,
  CertificateSummary,
  EnrollmentSummary,
  StudentProgress,
} from "@/core/domain/username-student-progress";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import { Badge } from "@/presentation/components/ui/badge";
import { StudentLogoutButton } from "@/presentation/components/student-dashboard/student-logout-button";

interface UsernameStudentDashboardViewProps {
  username: string;
  fullName?: string | null;
  progress: StudentProgress;
  loadError?: string | null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

const STATUS_LABELS: Record<string, string> = {
  registered: "Kayıtlı",
  attended: "Katıldı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
};

function EnrollmentsSection({ enrollments }: { enrollments: EnrollmentSummary[] }) {
  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        Henüz etkinlik kaydın yok. Velin, öğretmenin veya admin seni bir etkinliğe kaydedebilir.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {enrollments.map((item) => (
        <li
          key={item.enrollmentId}
          className="rounded-2xl border border-slate-100 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/40"
        >
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{STATUS_LABELS[item.status] ?? item.status}</Badge>
            {item.certificateCode ? <Badge tone="cyan">{item.certificateCode}</Badge> : null}
          </div>
          <h3 className="mt-2 font-semibold text-navy-950">{item.eventTitle}</h3>
          <p className="mt-1 text-sm text-slate-600">{formatDate(item.eventDate)}</p>
          <Link
            href={`/student-dashboard/enrollments/${item.enrollmentId}/forms`}
            className="mt-3 inline-flex text-sm font-semibold text-document-primary hover:underline"
          >
            Formları doldur →
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CertificatesSection({ certificates }: { certificates: CertificateSummary[] }) {
  if (certificates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        Henüz sertifikan yok. Etkinliklerini tamamladıkça burada görünecek.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {certificates.map((cert) => (
        <li
          key={cert.certificateCode}
          className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-navy-950">{cert.certificateCode}</p>
            <p className="text-sm text-slate-600">{formatDate(cert.issuedAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={cert.verifyUrl ?? `/dogrula/${cert.certificateCode}`}
              className="inline-flex rounded-xl border-2 border-document-primary bg-white px-4 py-2 text-sm font-semibold text-document-primary transition hover:bg-document-primary/5"
            >
              Doğrula
            </Link>
            {cert.pdfUrl ? (
              <a
                href={cert.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl bg-document-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-document-primary-hover"
              >
                PDF
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function BadgesSection({ badges }: { badges: BadgeSummary[] }) {
  if (badges.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        Rozetler yakında burada. Şimdilik etkinlik ve sertifikalarını takip edebilirsin.
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {badges.map((badge) => (
        <li
          key={`${badge.code ?? badge.name}-${badge.awardedAt}`}
          className="rounded-2xl border border-slate-100 p-4"
        >
          <p className="font-semibold text-navy-950">{badge.name}</p>
          {badge.description ? (
            <p className="mt-1 text-sm text-slate-600">{badge.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">{formatDate(badge.awardedAt)}</p>
        </li>
      ))}
    </ul>
  );
}

export function UsernameStudentDashboardView({
  username,
  fullName,
  progress,
  loadError = null,
}: UsernameStudentDashboardViewProps) {
  const greeting = fullName?.trim().split(/\s+/)[0] || username;

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div
          className={`flex flex-col gap-4 rounded-[2rem] border border-sky-200 ${BRAND_SURFACE_GRADIENT} p-8 text-sky-950 shadow-xl sm:flex-row sm:items-center sm:justify-between`}
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Öğrenci Paneli
            </p>
            <h1 className="mt-2 text-3xl font-black">Merhaba, {greeting}!</h1>
            <p className="mt-2 text-sm text-sky-900/80">
              Etkinliklerini, sertifikalarını ve rozetlerini buradan takip edebilirsin.
            </p>
            <p className="mt-1 text-xs text-sky-800/70">@{username}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/student-dashboard/profile"
              className="inline-flex items-center justify-center rounded-xl border-2 border-document-primary bg-white px-5 py-3 text-sm font-semibold text-document-primary transition hover:bg-document-primary/5"
            >
              Profilim
            </Link>
            <StudentLogoutButton />
          </div>
        </div>

        {loadError ? (
          <div
            className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-950"
            role="alert"
          >
            <p className="font-bold">Panel verileri yüklenemedi</p>
            <p className="mt-1">{loadError}</p>
          </div>
        ) : null}

        <div className="mt-8 space-y-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-navy-950">Etkinliklerim</h2>
            <EnrollmentsSection enrollments={progress.enrollments} />
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-navy-950">Sertifikalarım</h2>
            <CertificatesSection certificates={progress.certificates} />
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-navy-950">Rozetlerim</h2>
            <BadgesSection badges={progress.badges} />
          </div>
        </div>
      </div>
    </section>
  );
}
