"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { tryBuildStudentUsernameFromIdentity } from "@/shared/utils/student-username";
import { buildEnrollmentFormStatusLabel } from "@/shared/utils/enrollment-form-status";
import { EnrollmentFormProgress } from "@/presentation/components/dashboard/enrollment-form-progress";
import { ParentEnrollmentAttendanceProgress } from "@/presentation/components/dashboard/parent-enrollment-attendance-progress";
import { EVENT_TYPE_LABELS, type EventPaymentMode, type EventType } from "@/core/domain/event";
import { formatTryCentsDisplay } from "@/core/domain/payment";
import {
  eventPublicPriceTryCents,
  EXTERNAL_PAYMENT_NOTE,
  requiresIyzicoCheckout,
} from "@/infrastructure/events/event-payment-mode";
import {
  eventLocationLabel,
  formatEventDateTimeRange,
} from "@/shared/utils/event-format";
import {
  buildChildProfileForEnrollPath,
  isChildProfileReadyForEnrollment,
} from "@/shared/utils/event-enrollment";
import { PROFILE_INCOMPLETE_SAVE_BLOCKED_MESSAGE } from "@/lib/utils/progress";

export type ChildProgressPreview = {
  enrollments: Array<{
    enrollmentId: string;
    title: string;
    status: string;
    date: string;
    intakeCompleted?: boolean;
    consentsCompleted?: boolean;
    preTestCompleted?: boolean;
    postTestCompleted?: boolean;
    postTestUnlocked?: boolean;
    postTestDeadlineAt?: string | null;
    requiresSurveys?: boolean;
    requiresPreTest?: boolean;
    presentCount?: number;
    requiredLessonCount?: number;
    totalLessonCount?: number;
    attendanceComplete?: boolean;
  }>;
  certificates: Array<{ code: string; issuedAt: string; pdfUrl?: string | null }>;
  grades: Array<{
    documentTitle: string;
    score: number;
    feedback: string;
    createdAt: string;
    documentFileUrl: string;
  }>;
  badges: Array<{ name: string; awardedAt: string }>;
  printOrders: Array<{ itemName: string; status: string; requestedAt: string }>;
};

export type ChildStudent = {
  id: string;
  full_name: string;
  username: string;
  created_at: string;
  profileProgress?: number;
  enrollmentCount?: number;
  certificateCount?: number;
  progressPreview?: ChildProgressPreview;
};

export type EnrollableEventOption = {
  id: string;
  title: string;
  slug: string;
  eventType: EventType;
  categoryName: string | null;
  categoryColor: string | null;
  startAt: string;
  endAt: string;
  locationName: string | null;
  isOnline: boolean;
  isPaid: boolean;
  paymentMode: EventPaymentMode;
  priceTryCents: number | null;
  displayPriceTryCents: number | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Ödeme bekleniyor",
  registered: "Kayıtlı",
  attended: "Katıldı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
};

const PRINT_STATUS_LABELS: Record<string, string> = {
  queued: "Sırada",
  printing: "Basılıyor",
  ready: "Hazır",
  delivered: "Teslim",
  cancelled: "İptal",
};

const childActionLinkClass =
  "inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-surface bg-white px-3 text-center text-sm font-semibold text-navy-950 transition hover:bg-surface-section";

const childActionButtonClass = "h-10 w-full px-3 text-sm";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function formatEventSchedule(event: EnrollableEventOption): string {
  return formatEventDateTimeRange(new Date(event.startAt), new Date(event.endAt));
}

function formatEventLocation(event: EnrollableEventOption): string {
  return eventLocationLabel({
    isOnline: event.isOnline,
    locationName: event.locationName,
  });
}

function emptyPreview(): ChildProgressPreview {
  return {
    enrollments: [],
    certificates: [],
    grades: [],
    badges: [],
    printOrders: [],
  };
}

export function ChildrenStudentsClient({
  initialStudents,
  upcomingEvents,
  autoEnrollStudentId,
}: {
  initialStudents: ChildStudent[];
  upcomingEvents: EnrollableEventOption[];
  autoEnrollStudentId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingEventId = searchParams.get("eventId")?.trim() ?? "";
  const [students, setStudents] = useState<ChildStudent[]>(initialStudents);
  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ChildStudent | null>(null);
  const [enrollTarget, setEnrollTarget] = useState<ChildStudent | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function openEnrollForStudent(student: ChildStudent) {
    if (!isChildProfileReadyForEnrollment(student.profileProgress)) {
      router.push(
        buildChildProfileForEnrollPath(student.id, {
          eventId: pendingEventId || undefined,
        }),
      );
      return;
    }

    setEnrollTarget(student);
  }

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setAddOpen(true);
    }

    if (searchParams.get("enroll") === "1") {
      if (initialStudents.length === 0) {
        setAddOpen(true);
        return;
      }

      const target =
        (autoEnrollStudentId
          ? initialStudents.find((student) => student.id === autoEnrollStudentId)
          : null) ??
        (initialStudents.length === 1 ? initialStudents[0] : null);

      if (target) {
        if (!isChildProfileReadyForEnrollment(target.profileProgress)) {
          return;
        }
        setEnrollTarget(target);
      }
    }
  }, [autoEnrollStudentId, initialStudents, pendingEventId, router, searchParams]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.5rem] border border-border-surface bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border-surface bg-surface-section/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-navy-950">
              {students.length > 0
                ? `${students.length} çocuk hesabı`
                : "Çocuk hesapları"}
            </p>
            {students.length > 0 ? (
              <p className="mt-0.5 text-xs text-subtle">
                Detay, kayıt ve profil işlemlerini her satırdan yönetin.
              </p>
            ) : null}
          </div>
          <Button className="w-full shrink-0 sm:w-auto" onClick={() => setAddOpen(true)}>
            + Çocuk ekle
          </Button>
        </div>

        {students.length === 0 ? (
          <div className="space-y-4 p-8 text-center">
            <p className="text-sm font-semibold text-navy-950">Henüz çocuk hesabı eklenmedi</p>
            <p className="text-sm text-muted">
              Etkinliğe kayıt için önce çocuğunuzun kullanıcı adlı öğrenci hesabını oluşturun.
              Ardından «Etkinliğe kaydet» ile program seçebilirsiniz.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setAddOpen(true)}>+ Çocuk ekle</Button>
              {upcomingEvents.length > 0 ? (
                <Link
                  href="/etkinlikler"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-navy-800 bg-white px-5 py-3 text-sm font-semibold text-navy-950 shadow-md shadow-secondary/10 transition hover:border-navy-900 hover:bg-surface-section"
                >
                  Etkinlikleri gör
                </Link>
              ) : (
                <Link
                  href="/dashboard/kurs-talebi"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-navy-800 bg-white px-5 py-3 text-sm font-semibold text-navy-950 shadow-md shadow-secondary/10 transition hover:border-navy-900 hover:bg-surface-section"
                >
                  Kurs talebi oluştur
                </Link>
              )}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border-surface">
            {students.map((student) => {
              const expanded = expandedId === student.id;
              const preview = student.progressPreview ?? emptyPreview();
              const profileProgress = student.profileProgress ?? 0;
              const activeEnrollment = preview.enrollments.find((item) => item.status !== "cancelled");
              const attendanceSummary = activeEnrollment
                ? `${activeEnrollment.presentCount ?? 0}/${activeEnrollment.totalLessonCount ?? 12} katılım`
                : null;

              return (
                <li key={student.id} className="p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-navy-950 break-words">
                          {student.full_name}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            profileProgress >= 100
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          Profil %{profileProgress}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-subtle">@{student.username}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-surface-section px-2.5 py-1 text-xs font-medium text-[var(--text-on-surface-soft)]">
                          {student.enrollmentCount ?? 0} etkinlik
                        </span>
                        {attendanceSummary ? (
                          <span className="rounded-full bg-surface-section px-2.5 py-1 text-xs font-medium text-navy-900">
                            {attendanceSummary}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-900">
                          {student.certificateCount ?? 0} sertifika
                        </span>
                        {profileProgress < 100 ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">
                            Sertifika için profil %100
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid w-full shrink-0 grid-cols-2 gap-2 xl:w-[32rem] xl:grid-cols-4">
                      <Button
                        variant="outline"
                        className={childActionButtonClass}
                        onClick={() => setExpandedId(expanded ? null : student.id)}
                      >
                        {expanded ? "Gizle" : "Detay"}
                      </Button>
                      <Button
                        variant="outline"
                        className={childActionButtonClass}
                        onClick={() => openEnrollForStudent(student)}
                      >
                        Etkinliğe kaydet
                      </Button>
                      <Link
                        href={`/dashboard/children/${student.id}/profile`}
                        className={childActionLinkClass}
                      >
                        Profili düzenle
                      </Link>
                      <Button
                        variant="outline"
                        className={childActionButtonClass}
                        onClick={() => setResetTarget(student)}
                      >
                        Şifreyi sıfırla
                      </Button>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="mt-4 space-y-4 rounded-2xl border border-border-surface bg-surface-section p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DetailBlock title="Etkinlikler">
                          {preview.enrollments.length === 0 ? (
                            <p className="text-sm text-muted">Kayıt yok</p>
                          ) : (
                            <ul className="space-y-3">
                              {preview.enrollments.map((item) => (
                                <li key={item.enrollmentId} className="text-sm text-[var(--text-on-surface-soft)]">
                                  <p>
                                    <span className="font-medium">{item.title}</span>
                                    <span className="text-subtle">
                                      {" "}
                                      · {STATUS_LABELS[item.status] ?? item.status} ·{" "}
                                      {formatDate(item.date)}
                                    </span>
                                  </p>
                                  <p className="mt-0.5 text-xs text-subtle">
                                    {buildEnrollmentFormStatusLabel(item)}
                                  </p>
                                  {item.status !== "cancelled" && item.status !== "pending_payment" ? (
                                    <>
                                      <EnrollmentFormProgress
                                        intakeCompleted={item.intakeCompleted}
                                        consentsCompleted={item.consentsCompleted}
                                        preTestCompleted={item.preTestCompleted}
                                        postTestCompleted={item.postTestCompleted}
                                        postTestUnlocked={item.postTestUnlocked}
                                        requiresPreTest={item.requiresPreTest}
                                        requiresSurveys={item.requiresSurveys}
                                      />
                                      <ParentEnrollmentAttendanceProgress
                                        presentCount={item.presentCount}
                                        totalLessonCount={item.totalLessonCount}
                                      />
                                    </>
                                  ) : null}
                                  {item.status === "pending_payment" ? (
                                    <p className="mt-1 text-xs font-medium text-amber-900">
                                      Ödeme tamamlanmalı. Kaydı yeniden deneyerek ödemeye
                                      dönebilirsiniz.
                                    </p>
                                  ) : null}
                                  {item.status !== "cancelled" &&
                                  item.status !== "pending_payment" &&
                                  !item.enrollmentId.startsWith("temp-") ? (
                                    <Link
                                      href={`/dashboard/children/${student.id}/enrollments/${item.enrollmentId}/forms`}
                                      className="mt-1 inline-flex text-xs font-semibold text-document-primary hover:underline"
                                    >
                                      Formları doldur →
                                    </Link>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </DetailBlock>

                        <DetailBlock title="Sertifikalar">
                          {preview.certificates.length === 0 ? (
                            <p className="text-sm text-muted">Sertifika yok</p>
                          ) : (
                            <ul className="space-y-3">
                              {preview.certificates.map((item) => (
                                <li key={item.code} className="text-sm text-[var(--text-on-surface-soft)]">
                                  <p>
                                    <span className="font-medium">{item.code}</span>
                                    <span className="text-subtle">
                                      {" "}
                                      · {formatDate(item.issuedAt)}
                                    </span>
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    <a
                                      href={`/dogrula/${item.code}`}
                                      className="text-xs font-semibold text-document-primary hover:underline"
                                    >
                                      Doğrula
                                    </a>
                                    {item.pdfUrl ? (
                                      <a
                                        href={item.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold text-document-primary hover:underline"
                                      >
                                        PDF indir
                                      </a>
                                    ) : null}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </DetailBlock>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <DetailBlock title="Notlar">
                          {preview.grades.length === 0 ? (
                            <p className="text-sm text-muted">Henüz not yok</p>
                          ) : (
                            <ul className="space-y-3">
                              {preview.grades.map((item, index) => (
                                <li
                                  key={`${item.documentTitle}-${index}`}
                                  className="text-sm text-[var(--text-on-surface-soft)]"
                                >
                                  <p>
                                    <span className="font-medium">{item.documentTitle}</span>
                                    <span className="text-subtle">
                                      {" "}
                                      · {item.score} puan · {formatDate(item.createdAt)}
                                    </span>
                                  </p>
                                  {item.feedback ? (
                                    <p className="mt-0.5 text-xs text-subtle">{item.feedback}</p>
                                  ) : null}
                                  {item.documentFileUrl && item.documentFileUrl !== "#" ? (
                                    <a
                                      href={item.documentFileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-1 inline-flex text-xs font-semibold text-document-primary hover:underline"
                                    >
                                      Ödev dosyası
                                    </a>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </DetailBlock>

                        <DetailBlock title="Rozetler / Baskı">
                          {preview.badges.length === 0 && preview.printOrders.length === 0 ? (
                            <p className="text-sm text-muted">Kayıt yok</p>
                          ) : (
                            <div className="space-y-3">
                              {preview.badges.map((item) => (
                                <p key={`${item.name}-${item.awardedAt}`} className="text-sm text-[var(--text-on-surface-soft)]">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-subtle">
                                    {" "}
                                    · {formatDate(item.awardedAt)}
                                  </span>
                                </p>
                              ))}
                              {preview.printOrders.map((item, index) => (
                                <p
                                  key={`${item.itemName}-${index}`}
                                  className="text-sm text-[var(--text-on-surface-soft)]"
                                >
                                  <span className="font-medium">{item.itemName}</span>
                                  <span className="text-subtle">
                                    {" "}
                                    · {PRINT_STATUS_LABELS[item.status] ?? item.status} ·{" "}
                                    {formatDate(item.requestedAt)}
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}
                        </DetailBlock>
                      </div>

                      <p className="text-xs text-subtle">
                        Katılımcı formlarını bu panelden çocuğunuz adına doldurabilirsiniz. Eksik
                        profil için{" "}
                        <Link
                          href={`/dashboard/children/${student.id}/profile`}
                          className="font-semibold text-document-primary hover:underline"
                        >
                          Profili düzenle
                        </Link>
                        . Profil %{profileProgress}
                        {profileProgress < 100
                          ? " — sertifika için profilin %100 olması gerekir."
                          : " — sertifika için profil hazır."}
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {addOpen ? (
        <AddStudentDialog
          onClose={() => setAddOpen(false)}
          onCreated={(student) => {
            setStudents((prev) => [student, ...prev]);
            setAddOpen(false);

            const params = new URLSearchParams();
            if (pendingEventId) {
              params.set("eventId", pendingEventId);
            } else if (searchParams.get("enroll") === "1") {
              params.set("enroll", "1");
            }
            const query = params.toString();
            router.push(
              `/dashboard/children/${student.id}/profile${query ? `?${query}` : ""}`,
            );
          }}
        />
      ) : null}

      {resetTarget ? (
        <ResetPasswordDialog student={resetTarget} onClose={() => setResetTarget(null)} />
      ) : null}

      {enrollTarget ? (
        <EnrollStudentDialog
          student={enrollTarget}
          events={upcomingEvents}
          initialEventId={pendingEventId || undefined}
          onClose={() => setEnrollTarget(null)}
          onEnrolled={(eventTitle, alreadyEnrolled) => {
            if (!alreadyEnrolled) {
              setStudents((prev) =>
                prev.map((item) => {
                  if (item.id !== enrollTarget.id) {
                    return item;
                  }
                  const preview = item.progressPreview ?? emptyPreview();
                  const alreadyListed = preview.enrollments.some((row) => row.title === eventTitle);
                  if (alreadyListed) {
                    return item;
                  }
                  return {
                    ...item,
                    enrollmentCount: (item.enrollmentCount ?? 0) + 1,
                    progressPreview: {
                      ...preview,
                      enrollments: [
                        {
                          enrollmentId: `temp-${Date.now()}`,
                          title: eventTitle,
                          status: "registered",
                          date: new Date().toISOString(),
                          intakeCompleted: false,
                          consentsCompleted: false,
                          preTestCompleted: false,
                          postTestCompleted: false,
                          requiresSurveys: true,
                        },
                        ...preview.enrollments,
                      ],
                    },
                  };
                }),
              );
            }
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-subtle">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function AddStudentDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (student: ChildStudent) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [generatedUsername, setGeneratedUsername] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!fullName.trim() || !birthDate) {
      setGeneratedUsername(null);
      return;
    }
    setGeneratedUsername(tryBuildStudentUsernameFromIdentity(fullName, birthDate));
  }, [fullName, birthDate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!generatedUsername) {
      setError("Ad soyad ve doğum tarihini kontrol edin.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/parent/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, birthDate, password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: {
          student: ChildStudent;
          courseDemand?: { linked?: number; enrolled?: number };
        };
      };
      if (!response.ok || !payload.data?.student) {
        setError(payload.error ?? "Çocuk eklenemedi.");
        return;
      }
      const enrolledFromDemands = payload.data.courseDemand?.enrolled ?? 0;
      const linkedDemands = payload.data.courseDemand?.linked ?? 0;
      const demandNote =
        enrolledFromDemands > 0
          ? ` ${enrolledFromDemands} kurs talebi kayda dönüştürüldü.`
          : linkedDemands > 0
            ? ` ${linkedDemands} kurs talebi bu profile bağlandı.`
            : "";
      setSuccess(
        `${payload.data.student.full_name} eklendi. Kullanıcı adı: @${payload.data.student.username}${demandNote}`,
      );
      onCreated({
        ...payload.data.student,
        profileProgress: 0,
        enrollmentCount: 0,
        certificateCount: 0,
        progressPreview: emptyPreview(),
      });
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog title="Yeni çocuk ekle" onClose={onClose}>
      <form autoComplete="off" onSubmit={handleSubmit} className="space-y-3">
        <Input
          id="child-full-name"
          name="child-full-name"
          label="Ad Soyad"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="örn: Emre Yılmaz"
          autoComplete="name"
          readOnly
          onFocus={(event) => event.currentTarget.removeAttribute("readonly")}
          required
        />
        <Input
          id="child-birth-date"
          name="child-birth-date"
          label="Doğum tarihi"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          autoComplete="bday"
          required
        />
        {generatedUsername ? (
          <p className="rounded-xl border border-border-surface bg-surface-section px-4 py-3 text-sm text-navy-950">
            Tahmini kullanıcı adı:{" "}
            <span className="font-semibold">@{generatedUsername}</span>
            <span className="mt-1 block text-xs text-navy-900">
              Kardeş hesaplarında veya isim benzerliğinde sonuna rakam eklenebilir (ör. @
              {generatedUsername}2).
            </span>
          </p>
        ) : fullName.trim() && birthDate ? (
          <p className="text-xs text-amber-700">
            Kullanıcı adı üretilemedi. Ad ve soyadı birlikte yazdığınızdan emin olun.
          </p>
        ) : (
          <p className="text-xs text-subtle">
            Her çocuk için ayrı hesap açılır. İkinci kardeş için ilk kayıttan sonra tekrar Çocuk ekle
            butonunu kullanın. Kullanıcı adı: ad + soyad + doğum yılının son 2 hanesi.
          </p>
        )}
        <Input
          id="child-password"
          name="child-password"
          label="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        <DialogActions
          onClose={onClose}
          confirmLabel="Ekle"
          submitting={submitting}
          confirmType="submit"
        />
      </form>
    </Dialog>
  );
}

function ResetPasswordDialog({
  student,
  onClose,
}: {
  student: ChildStudent;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`/api/v1/parent/students/${student.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Şifre sıfırlanamadı.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog title={`${student.full_name} — şifreyi sıfırla`} onClose={onClose}>
      {success ? (
        <div className="space-y-4">
          <p className="text-sm text-emerald-700">
            Şifre güncellendi. Eski oturumlar geçersiz sayılır.
          </p>
          <Button className="w-full" onClick={onClose}>
            Kapat
          </Button>
        </div>
      ) : (
        <form autoComplete="off" onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="child-reset-password"
            name="child-reset-password"
            label="Yeni şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <DialogActions
            onClose={onClose}
            confirmLabel="Sıfırla"
            submitting={submitting}
            confirmType="submit"
          />
        </form>
      )}
    </Dialog>
  );
}

function EnrollStudentDialog({
  student,
  events,
  initialEventId,
  onClose,
  onEnrolled,
}: {
  student: ChildStudent;
  events: EnrollableEventOption[];
  initialEventId?: string;
  onClose: () => void;
  onEnrolled: (eventTitle: string, alreadyEnrolled: boolean) => void;
}) {
  const router = useRouter();
  const profileProgress = student.profileProgress ?? 0;
  const profileReady = isChildProfileReadyForEnrollment(profileProgress);
  const profileHref = buildChildProfileForEnrollPath(student.id, {
    eventId: initialEventId,
  });
  const [eventId, setEventId] = useState(initialEventId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profileReady) {
      return;
    }

    if (initialEventId) {
      setEventId(initialEventId);
      return;
    }

    if (events.length === 1) {
      setEventId(events[0]?.id ?? "");
    }
  }, [events, initialEventId, profileReady]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!eventId) {
      setError("Bir etkinlik seçin.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/v1/parent/students/${student.id}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: {
          alreadyEnrolled?: boolean;
          eventTitle?: string;
          enrollmentId?: string;
          requiresPayment?: boolean;
          paymentPageUrl?: string;
        };
      };
      if (!response.ok) {
        setError(payload.error ?? "Kayıt oluşturulamadı.");
        return;
      }

      const title = payload.data?.eventTitle ?? "Etkinlik";
      const alreadyEnrolled = Boolean(payload.data?.alreadyEnrolled);
      const enrollmentId = payload.data?.enrollmentId ?? null;
      const paymentPageUrl = payload.data?.paymentPageUrl?.trim() ?? "";

      if (payload.data?.requiresPayment && paymentPageUrl) {
        setRedirecting(true);
        onEnrolled(title, alreadyEnrolled);
        window.location.assign(paymentPageUrl);
        return;
      }

      onEnrolled(title, alreadyEnrolled);

      if (enrollmentId) {
        setRedirecting(true);
        router.push(`/dashboard/children/${student.id}/enrollments/${enrollmentId}/forms`);
        return;
      }

      setError("Kayıt alındı ancak form sayfasına yönlendirilemedi. Çocuk detayından formlara ulaşabilirsiniz.");
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!profileReady) {
    return (
      <Dialog title={`${student.full_name} — profil gerekli`} onClose={onClose}>
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[var(--text-on-surface-soft)]">{PROFILE_INCOMPLETE_SAVE_BLOCKED_MESSAGE}</p>
          <p className="text-sm font-semibold text-amber-900">Şu an profil %{profileProgress} dolu.</p>
          <Button className="w-full" onClick={() => router.push(profileHref)}>
            Profili tamamla
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Vazgeç
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog title={`${student.full_name} — etkinliğe kaydet`} onClose={onClose} size="lg">
      {events.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Şu an kayda açık yaklaşan etkinlik yok. Yeni etkinlikler yayınlandığında burada
            görünecek.
          </p>
          <Button className="w-full" onClick={onClose}>
            Kapat
          </Button>
        </div>
      ) : redirecting ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-emerald-700">Yönlendiriliyorsunuz…</p>
          <p className="text-sm text-muted">
            Ödeme veya form adımına geçiliyor. Lütfen bekleyin.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm leading-6 text-muted">
            <strong className="font-semibold text-navy-950">{student.full_name}</strong> bu etkinliğe
            kaydedilecek. Kartla ödemeli etkinliklerde önce güvenli ödeme, ardından tanışma ve onay
            formları açılır. Kurum/okul tahsilatlı etkinliklerde ödeme bu panelden alınmaz.
          </p>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-navy-950">Etkinlik seçin</legend>
            {events.map((item) => {
              const selected = eventId === item.id;
              const publicPrice = eventPublicPriceTryCents(item);
              return (
                <label
                  key={item.id}
                  className={`block cursor-pointer rounded-2xl border p-4 transition ${
                    selected
                      ? "border-document-primary bg-surface-section/60 ring-2 ring-document-primary/15"
                      : "border-border-surface bg-white hover:border-secondary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="enroll-event"
                    value={item.id}
                    checked={selected}
                    onChange={() => setEventId(item.id)}
                    className="sr-only"
                  />
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-cyan-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cyan-900">
                      {EVENT_TYPE_LABELS[item.eventType]}
                    </span>
                    {item.categoryName ? (
                      <span
                        className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                        style={{ backgroundColor: item.categoryColor ?? "#2563eb" }}
                      >
                        {item.categoryName}
                      </span>
                    ) : null}
                    {item.isOnline ? (
                      <span className="inline-flex rounded-full bg-surface-section px-2.5 py-0.5 text-[11px] font-bold text-[var(--text-on-surface-soft)]">
                        Online
                      </span>
                    ) : null}
                    {publicPrice != null ? (
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
                        {formatTryCentsDisplay(publicPrice)}
                      </span>
                    ) : null}
                    {item.paymentMode === "external" ? (
                      <span className="inline-flex rounded-full bg-surface-section px-2.5 py-0.5 text-[11px] font-bold text-[var(--text-on-surface-soft)]">
                        Kurum/okul
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-base font-bold leading-snug text-navy-950">{item.title}</p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-on-surface-soft)]">{formatEventSchedule(item)}</p>
                  <p className="mt-1 text-sm text-muted">{formatEventLocation(item)}</p>
                  {item.paymentMode === "external" ? (
                    <p className="mt-2 text-xs leading-5 text-subtle">{EXTERNAL_PAYMENT_NOTE}</p>
                  ) : null}
                  <Link
                    href={`/etkinlikler/${item.slug}`}
                    className="mt-3 inline-flex text-sm font-semibold text-document-primary hover:underline"
                    onClick={(clickEvent) => clickEvent.stopPropagation()}
                  >
                    Etkinlik detayını gör →
                  </Link>
                </label>
              );
            })}
          </fieldset>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <DialogActions
            onClose={onClose}
            confirmLabel={
              (() => {
                const selected = events.find((item) => item.id === eventId);
                if (!selected) {
                  return "Kaydet";
                }
                return requiresIyzicoCheckout(selected.paymentMode) ? "Ödemeye geç" : "Kaydet";
              })()
            }
            submitting={submitting}
            confirmType="submit"
          />
        </form>
      )}
    </Dialog>
  );
}

function Dialog({
  title,
  onClose,
  children,
  size = "sm",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "lg";
}) {
  const widthClass = size === "lg" ? "max-w-xl" : "max-w-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/40 p-4 sm:items-center">
      <div
        className={`flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full ${widthClass} flex-col overflow-hidden rounded-[1.5rem] border border-border-surface bg-white shadow-xl`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-surface px-6 py-4">
          <h2 className="pr-2 text-base font-bold leading-snug text-navy-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-subtle transition hover:bg-surface-section hover:text-[var(--text-on-surface-soft)]"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function DialogActions({
  onClose,
  confirmLabel,
  submitting,
  confirmType = "button",
}: {
  onClose: () => void;
  confirmLabel: string;
  submitting: boolean;
  confirmType?: "button" | "submit";
}) {
  return (
    <div className="mt-2 flex gap-2">
      <Button variant="outline" className="flex-1" onClick={onClose} type="button">
        Vazgeç
      </Button>
      <Button className="flex-1" type={confirmType} disabled={submitting}>
        {submitting ? "…" : confirmLabel}
      </Button>
    </div>
  );
}
