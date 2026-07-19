"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

export type ChildProgressPreview = {
  enrollments: Array<{ title: string; status: string; date: string }>;
  certificates: Array<{ code: string; issuedAt: string }>;
};

export type ChildStudent = {
  id: string;
  full_name: string;
  username: string;
  created_at: string;
  enrollmentCount?: number;
  certificateCount?: number;
  progressPreview?: ChildProgressPreview;
};

const STATUS_LABELS: Record<string, string> = {
  registered: "Kayıtlı",
  attended: "Katıldı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
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

export function ChildrenStudentsClient({ initialStudents }: { initialStudents: ChildStudent[] }) {
  const [students, setStudents] = useState<ChildStudent[]>(initialStudents);
  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ChildStudent | null>(null);
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
              const preview = student.progressPreview;

              return (
                <li key={student.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-navy-950">{student.full_name}</p>
                      <p className="text-sm text-slate-500">@{student.username}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {student.enrollmentCount ?? 0} etkinlik ·{" "}
                        {student.certificateCount ?? 0} sertifika
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setExpandedId(expanded ? null : student.id)}
                      >
                        {expanded ? "Gizle" : "Detay"}
                      </Button>
                      <Button variant="outline" onClick={() => setResetTarget(student)}>
                        Şifreyi sıfırla
                      </Button>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="mt-4 grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Etkinlikler
                        </p>
                        {(preview?.enrollments.length ?? 0) === 0 ? (
                          <p className="mt-2 text-sm text-slate-600">Kayıt yok</p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {preview!.enrollments.map((item, index) => (
                              <li key={`${item.title}-${index}`} className="text-sm text-slate-700">
                                <span className="font-medium">{item.title}</span>
                                <span className="text-slate-500">
                                  {" "}
                                  · {STATUS_LABELS[item.status] ?? item.status} ·{" "}
                                  {formatDate(item.date)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Sertifikalar
                        </p>
                        {(preview?.certificates.length ?? 0) === 0 ? (
                          <p className="mt-2 text-sm text-slate-600">Sertifika yok</p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {preview!.certificates.map((item) => (
                              <li key={item.code} className="text-sm text-slate-700">
                                <span className="font-medium">{item.code}</span>
                                <span className="text-slate-500">
                                  {" "}
                                  · {formatDate(item.issuedAt)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
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
        enrollmentCount: 0,
        certificateCount: 0,
        progressPreview: { enrollments: [], certificates: [] },
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
