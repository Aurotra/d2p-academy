"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { tryBuildStudentUsernameFromIdentity } from "@/shared/utils/student-username";
import { buildEnrollmentFormStatusLabel } from "@/shared/utils/enrollment-form-status";
import { EVENT_TYPE_LABELS, type EventType } from "@/core/domain/event";
import {
  eventLocationLabel,
  formatEventDateTimeRange,
} from "@/shared/utils/event-format";

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
};

const STATUS_LABELS: Record<string, string> = {
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
}: {
  initialStudents: ChildStudent[];
  upcomingEvents: EnrollableEventOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingEventId = searchParams.get("eventId")?.trim() ?? "";
  const [students, setStudents] = useState<ChildStudent[]>(initialStudents);
  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ChildStudent | null>(null);
  const [enrollTarget, setEnrollTarget] = useState<ChildStudent | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setAddOpen(true);
    }

    if (searchParams.get("enroll") === "1") {
      if (initialStudents.length > 0) {
        setEnrollTarget(initialStudents[0] ?? null);
      } else {
        setAddOpen(true);
      }
    }
  }, [initialStudents, searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>+ Çocuk ekle</Button>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        {students.length === 0 ? (
          <div className="space-y-4 p-8 text-center">
            <p className="text-sm font-semibold text-navy-950">Henüz çocuk hesabı eklenmedi</p>
            <p className="text-sm text-slate-600">
              Etkinliğe kayıt için önce çocuğunuzun kullanıcı adlı öğrenci hesabını oluşturun.
              Ardından «Etkinliğe kaydet» ile program seçebilirsiniz.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setAddOpen(true)}>+ Çocuk ekle</Button>
              {upcomingEvents.length > 0 ? (
                <Link
                  href="/etkinlikler"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-sky-800 bg-white px-5 py-3 text-sm font-semibold text-sky-950 shadow-md shadow-sky-200/60 transition hover:border-sky-900 hover:bg-sky-50"
                >
                  Etkinlikleri gör
                </Link>
              ) : (
                <Link
                  href="/dashboard/kurs-talebi"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-sky-800 bg-white px-5 py-3 text-sm font-semibold text-sky-950 shadow-md shadow-sky-200/60 transition hover:border-sky-900 hover:bg-sky-50"
                >
                  Kurs talebi oluştur
                </Link>
              )}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {students.map((student) => {
              const expanded = expandedId === student.id;
              const preview = student.progressPreview ?? emptyPreview();
              const profileProgress = student.profileProgress ?? 0;

              return (
                <li key={student.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-navy-950">{student.full_name}</p>
                      <p className="text-sm text-slate-500">@{student.username}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {student.enrollmentCount ?? 0} etkinlik ·{" "}
                        {student.certificateCount ?? 0} sertifika · profil %{profileProgress}
                        {profileProgress < 100 ? " (sertifika için %100 gerekir)" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setExpandedId(expanded ? null : student.id)}
                      >
                        {expanded ? "Gizle" : "Detay"}
                      </Button>
                      <Button variant="outline" onClick={() => setEnrollTarget(student)}>
                        Etkinliğe kaydet
                      </Button>
                      <Link
                        href={`/dashboard/children/${student.id}/profile`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-slate-50"
                      >
                        Profili düzenle
                      </Link>
                      <Button variant="outline" onClick={() => setResetTarget(student)}>
                        Şifreyi sıfırla
                      </Button>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="mt-4 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DetailBlock title="Etkinlikler">
                          {preview.enrollments.length === 0 ? (
                            <p className="text-sm text-slate-600">Kayıt yok</p>
                          ) : (
                            <ul className="space-y-3">
                              {preview.enrollments.map((item) => (
                                <li key={item.enrollmentId} className="text-sm text-slate-700">
                                  <p>
                                    <span className="font-medium">{item.title}</span>
                                    <span className="text-slate-500">
                                      {" "}
                                      · {STATUS_LABELS[item.status] ?? item.status} ·{" "}
                                      {formatDate(item.date)}
                                    </span>
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {buildEnrollmentFormStatusLabel(item)}
                                  </p>
                                  {item.status !== "cancelled" &&
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
                            <p className="text-sm text-slate-600">Sertifika yok</p>
                          ) : (
                            <ul className="space-y-3">
                              {preview.certificates.map((item) => (
                                <li key={item.code} className="text-sm text-slate-700">
                                  <p>
                                    <span className="font-medium">{item.code}</span>
                                    <span className="text-slate-500">
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
                            <p className="text-sm text-slate-600">Henüz not yok</p>
                          ) : (
                            <ul className="space-y-3">
                              {preview.grades.map((item, index) => (
                                <li
                                  key={`${item.documentTitle}-${index}`}
                                  className="text-sm text-slate-700"
                                >
                                  <p>
                                    <span className="font-medium">{item.documentTitle}</span>
                                    <span className="text-slate-500">
                                      {" "}
                                      · {item.score} puan · {formatDate(item.createdAt)}
                                    </span>
                                  </p>
                                  {item.feedback ? (
                                    <p className="mt-0.5 text-xs text-slate-500">{item.feedback}</p>
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
                            <p className="text-sm text-slate-600">Kayıt yok</p>
                          ) : (
                            <div className="space-y-3">
                              {preview.badges.map((item) => (
                                <p key={`${item.name}-${item.awardedAt}`} className="text-sm text-slate-700">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-slate-500">
                                    {" "}
                                    · {formatDate(item.awardedAt)}
                                  </span>
                                </p>
                              ))}
                              {preview.printOrders.map((item, index) => (
                                <p
                                  key={`${item.itemName}-${index}`}
                                  className="text-sm text-slate-700"
                                >
                                  <span className="font-medium">{item.itemName}</span>
                                  <span className="text-slate-500">
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

                      <p className="text-xs text-slate-500">
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
            if (searchParams.get("enroll") === "1" || pendingEventId) {
              setEnrollTarget(student);
            }
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
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
          autoComplete="off"
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
          <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
            Tahmini kullanıcı adı:{" "}
            <span className="font-semibold">@{generatedUsername}</span>
            <span className="mt-1 block text-xs text-sky-800">
              Kardeş hesaplarında veya isim benzerliğinde sonuna rakam eklenebilir (ör. @
              {generatedUsername}2).
            </span>
          </p>
        ) : fullName.trim() && birthDate ? (
          <p className="text-xs text-amber-700">
            Kullanıcı adı üretilemedi. Ad ve soyadı birlikte yazdığınızdan emin olun.
          </p>
        ) : (
          <p className="text-xs text-slate-500">
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
  const [eventId, setEventId] = useState(initialEventId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialEventId) {
      setEventId(initialEventId);
      return;
    }

    if (events.length === 1) {
      setEventId(events[0]?.id ?? "");
    }
  }, [initialEventId, events]);

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
        };
      };
      if (!response.ok) {
        setError(payload.error ?? "Kayıt oluşturulamadı.");
        return;
      }

      const title = payload.data?.eventTitle ?? "Etkinlik";
      const alreadyEnrolled = Boolean(payload.data?.alreadyEnrolled);
      const enrollmentId = payload.data?.enrollmentId ?? null;
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

  return (
    <Dialog title={`${student.full_name} — etkinliğe kaydet`} onClose={onClose} size="lg">
      {events.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Şu an kayda açık yaklaşan etkinlik yok. Yeni etkinlikler yayınlandığında burada
            görünecek.
          </p>
          <Button className="w-full" onClick={onClose}>
            Kapat
          </Button>
        </div>
      ) : redirecting ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-emerald-700">Kayıt tamamlandı.</p>
          <p className="text-sm text-slate-600">
            Tanışma ve Onaylar formlarına yönlendiriliyorsunuz…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            <strong className="font-semibold text-navy-950">{student.full_name}</strong> bu etkinliğe
            kaydedilecek. Kayıt sonrası tanışma ve onay formları açılır.
          </p>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-navy-950">Etkinlik seçin</legend>
            {events.map((item) => {
              const selected = eventId === item.id;
              return (
                <label
                  key={item.id}
                  className={`block cursor-pointer rounded-2xl border p-4 transition ${
                    selected
                      ? "border-document-primary bg-sky-50/60 ring-2 ring-document-primary/15"
                      : "border-slate-200 bg-white hover:border-sky-300"
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
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                        Online
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-base font-bold leading-snug text-navy-950">{item.title}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{formatEventSchedule(item)}</p>
                  <p className="mt-1 text-sm text-slate-600">{formatEventLocation(item)}</p>
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
            confirmLabel="Kaydet"
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        className={`flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full ${widthClass} flex-col overflow-hidden rounded-[1.5rem] border border-sky-200 bg-white shadow-xl`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h2 className="pr-2 text-base font-bold leading-snug text-navy-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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
