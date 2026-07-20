"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";

export type ChildProgressPreview = {
  enrollments: Array<{
    title: string;
    status: string;
    date: string;
    intakeCompleted?: boolean;
    preTestCompleted?: boolean;
    postTestCompleted?: boolean;
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
  startAt: string;
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

function formatEventOption(event: EnrollableEventOption): string {
  return `${event.title} · ${formatDate(event.startAt)}`;
}

function formStatusLabel(enrollment: {
  intakeCompleted?: boolean;
  preTestCompleted?: boolean;
  postTestCompleted?: boolean;
}): string {
  const done = [
    enrollment.intakeCompleted ? "Kayıt formu" : null,
    enrollment.preTestCompleted ? "Ön test" : null,
    enrollment.postTestCompleted ? "Son test" : null,
  ].filter(Boolean);

  if (done.length === 3) {
    return "Formlar tamam";
  }
  if (done.length === 0) {
    return "Formlar eksik";
  }
  return `Tamamlanan: ${done.join(", ")}`;
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
  const [students, setStudents] = useState<ChildStudent[]>(initialStudents);
  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ChildStudent | null>(null);
  const [enrollTarget, setEnrollTarget] = useState<ChildStudent | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>+ Çocuk ekle</Button>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        {students.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600">
            Henüz eklenmiş bir çocuk yok. Başlamak için &quot;Çocuk ekle&quot; butonunu kullan.
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
                              {preview.enrollments.map((item, index) => (
                                <li key={`${item.title}-${index}`} className="text-sm text-slate-700">
                                  <p>
                                    <span className="font-medium">{item.title}</span>
                                    <span className="text-slate-500">
                                      {" "}
                                      · {STATUS_LABELS[item.status] ?? item.status} ·{" "}
                                      {formatDate(item.date)}
                                    </span>
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {formStatusLabel(item)}
                                  </p>
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
                        Katılımcı formlarını ve profili çocuk kendi öğrenci girişi ile tamamlar.
                        Profil %{profileProgress}
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
                          title: eventTitle,
                          status: "registered",
                          date: new Date().toISOString(),
                          intakeCompleted: false,
                          preTestCompleted: false,
                          postTestCompleted: false,
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/parent/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: { student: ChildStudent };
      };
      if (!response.ok || !payload.data?.student) {
        setError(payload.error ?? "Çocuk eklenemedi.");
        return;
      }
      setSuccess(`${payload.data.student.full_name} eklendi.`);
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
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Ad Soyad"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label="Kullanıcı adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="orn: ayse_2015"
          required
        />
        <Input
          label="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Yeni şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
  onClose,
  onEnrolled,
}: {
  student: ChildStudent;
  events: EnrollableEventOption[];
  onClose: () => void;
  onEnrolled: (eventTitle: string, alreadyEnrolled: boolean) => void;
}) {
  const [eventId, setEventId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
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
        data?: { alreadyEnrolled?: boolean; eventTitle?: string };
      };
      if (!response.ok) {
        setError(payload.error ?? "Kayıt oluşturulamadı.");
        return;
      }

      const title = payload.data?.eventTitle ?? "Etkinlik";
      const alreadyEnrolled = Boolean(payload.data?.alreadyEnrolled);
      if (alreadyEnrolled) {
        setSuccess(`${student.full_name} bu etkinliğe zaten kayıtlı.`);
      } else {
        setSuccess(`${student.full_name} “${title}” etkinliğine kaydedildi.`);
      }
      onEnrolled(title, alreadyEnrolled);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog title={`${student.full_name} — etkinliğe kaydet`} onClose={onClose}>
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
      ) : success ? (
        <div className="space-y-4">
          <p className="text-sm text-emerald-700">{success}</p>
          <Button className="w-full" onClick={onClose}>
            Kapat
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select
            label="Etkinlik"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            required
          >
            <option value="">Etkinlik seçin</option>
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {formatEventOption(item)}
              </option>
            ))}
          </Select>
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
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-[1.5rem] border border-sky-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-navy-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        {children}
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
