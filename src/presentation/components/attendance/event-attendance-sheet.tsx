"use client";

import { useMemo, useState } from "react";

import type { AttendanceStatus, EventAttendanceSheet } from "@/core/domain/event-attendance";
import { ATTENDANCE_STATUS_LABELS } from "@/core/domain/event-attendance";
import { formatEventAttendanceWindowLabel } from "@/shared/utils/event-attendance-window";
import { Button } from "@/presentation/components/ui/button";

const STATUS_OPTIONS: AttendanceStatus[] = ["present", "absent", "excused"];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "border-emerald-300 bg-emerald-100 text-emerald-800",
  absent: "border-rose-300 bg-rose-100 text-rose-800",
  excused: "border-amber-300 bg-amber-100 text-amber-900",
};

interface EventAttendanceSheetProps {
  sheet: EventAttendanceSheet;
  apiBasePath: string;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function EventAttendanceSheetView({ sheet, apiBasePath }: EventAttendanceSheetProps) {
  const [rows, setRows] = useState(sheet.students);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState(sheet.sessions[0]?.id ?? "");
  const [showOverview, setShowOverview] = useState(false);

  const selectedSession = useMemo(
    () => sheet.sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sheet.sessions, selectedSessionId],
  );

  const markedInSession = useMemo(() => {
    if (!selectedSession) {
      return 0;
    }
    return rows.filter((row) => row.attendance[selectedSession.id] != null).length;
  }, [rows, selectedSession]);

  const completeStudents = useMemo(
    () => rows.filter((row) => row.attendanceComplete).length,
    [rows],
  );

  async function saveStatus(enrollmentId: string, sessionId: string, status: AttendanceStatus) {
    const key = `${enrollmentId}:${sessionId}`;
    setPendingKey(key);
    setError(null);

    try {
      const response = await fetch(`${apiBasePath}/${sheet.eventId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, sessionId, status }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Yoklama kaydedilemedi.");
      }

      setRows((current) =>
        current.map((row) => {
          if (row.enrollmentId !== enrollmentId) {
            return row;
          }

          const attendance = {
            ...row.attendance,
            [sessionId]: status,
          };
          const presentCount = Object.values(attendance).filter((value) => value === "present")
            .length;

          return {
            ...row,
            attendance,
            presentCount,
            attendanceComplete: presentCount >= sheet.requiredLessonCount,
            enrollmentStatus:
              presentCount >= sheet.requiredLessonCount && row.enrollmentStatus === "registered"
                ? "attended"
                : row.enrollmentStatus,
          };
        }),
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt başarısız.");
    } finally {
      setPendingKey(null);
    }
  }

  async function markAllPresent(sessionId: string) {
    if (!sheet.canEdit) {
      return;
    }

    setBulkPending(true);
    setError(null);

    try {
      const targets = rows.filter((row) => row.attendance[sessionId] !== "present");
      for (const row of targets) {
        await saveStatus(row.enrollmentId, sessionId, "present");
      }
    } finally {
      setBulkPending(false);
    }
  }

  if (sheet.sessions.length === 0) {
    return (
      <div className="space-y-4">
        <AttendanceHeader
          title={sheet.eventTitle}
          startAt={sheet.startAt}
          endAt={sheet.endAt}
          studentCount={sheet.students.length}
          sessionCount={0}
          requiredLessonCount={sheet.requiredLessonCount}
          completeCount={0}
        />
        {sheet.students.length > 0 ? (
          <EmptyScheduleRoster students={sheet.students} />
        ) : (
          <EmptyState message="Bu etkinlikte henüz kayıtlı öğrenci yok." />
        )}
        <EmptyState message="Ders çizelgesi oluşturulamadı. Etkinlik tarihleri ve günlük ders saatlerini kontrol edin." />
      </div>
    );
  }

  const outsideEventWindow = !sheet.attendanceOpen;

  return (
    <div className="space-y-4">
      <AttendanceHeader
        title={sheet.eventTitle}
        startAt={sheet.startAt}
        endAt={sheet.endAt}
        studentCount={rows.length}
        sessionCount={sheet.totalLessonCount}
        requiredLessonCount={sheet.requiredLessonCount}
        completeCount={completeStudents}
      />

      {outsideEventWindow ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Etkinlik dışı işaretleme ({formatEventAttendanceWindowLabel(sheet.startAt, sheet.endAt)}).
          Kayıtlar admin loglarında tutulur.
        </p>
      ) : null}

      <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">Ders seçin</p>
          <p className="mt-1 text-xs text-slate-500">
            Önce dersi seçin, ardından öğrenciler için Geldi / Gelmedi / İzinli işaretleyin.
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {sheet.sessions.map((session) => {
              const active = session.id === selectedSessionId;
              const sessionMarked = rows.filter((row) => row.attendance[session.id] != null).length;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-left transition ${
                    active
                      ? "bg-document-primary text-white shadow-sm"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300"
                  }`}
                >
                  <span className="block text-sm font-semibold">{session.label}</span>
                  <span
                    className={`mt-0.5 block text-xs ${active ? "text-white/80" : "text-slate-500"}`}
                  >
                    {sessionMarked}/{rows.length} işaretlendi
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedSession ? (
          <div className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedSession.label}</h2>
                <p className="text-sm text-slate-500">
                  {markedInSession}/{rows.length} öğrenci işaretlendi
                </p>
              </div>
              {sheet.canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={bulkPending || rows.length === 0}
                  onClick={() => void markAllPresent(selectedSession.id)}
                  className="shrink-0"
                >
                  {bulkPending ? "Kaydediliyor…" : "Hepsini geldi işaretle"}
                </Button>
              ) : null}
            </div>

            {error ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {rows.length === 0 ? (
              <EmptyState message="Bu etkinlikte kayıtlı öğrenci yok." />
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
                {rows.map((row, index) => {
                  const status = row.attendance[selectedSession.id] ?? null;
                  const rowPending = pendingKey?.startsWith(`${row.enrollmentId}:`) ?? false;

                  return (
                    <li
                      key={row.enrollmentId}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {index + 1}
                          </span>
                          <p className="truncate font-semibold text-slate-900">{row.studentName}</p>
                        </div>
                        <p className="mt-1 pl-9 text-sm text-slate-500">{row.studentContact}</p>
                        <p className="mt-1 pl-9 text-xs text-slate-500">
                          Toplam katılım: {row.presentCount}/{sheet.requiredLessonCount}
                          {row.attendanceComplete ? " · F03 için uygun" : ""}
                        </p>
                      </div>

                      {sheet.canEdit ? (
                        <StatusButtonGroup
                          status={status}
                          disabled={rowPending}
                          onSelect={(next) =>
                            void saveStatus(row.enrollmentId, selectedSession.id, next)
                          }
                        />
                      ) : (
                        <StatusReadonly status={status} />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowOverview((current) => !current)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div>
            <p className="font-semibold text-slate-900">Tüm dersler özeti</p>
            <p className="text-sm text-slate-500">
              {completeStudents}/{rows.length} öğrenci zorunlu katılımı tamamladı
            </p>
          </div>
          <span className="text-sm font-semibold text-document-primary">
            {showOverview ? "Gizle" : "Göster"}
          </span>
        </button>

        {showOverview ? (
          <div className="border-t border-slate-100 px-2 pb-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-600">
                  <tr>
                    <th className="sticky left-0 z-10 bg-white px-3 py-2 font-semibold">Öğrenci</th>
                    {sheet.sessions.map((session) => (
                      <th key={session.id} className="min-w-16 px-1 py-2 text-center text-xs font-semibold">
                        {session.label}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center font-semibold">Katılım</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.enrollmentId} className="border-t border-slate-100">
                      <td className="sticky left-0 z-10 max-w-32 truncate bg-white px-3 py-2 font-medium text-slate-900">
                        {row.studentName}
                      </td>
                      {sheet.sessions.map((session) => {
                        const status = row.attendance[session.id] ?? null;
                        return (
                          <td key={session.id} className="px-1 py-2 text-center">
                            <OverviewCell status={status} />
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center text-xs font-semibold text-slate-700">
                        {row.presentCount}/{sheet.requiredLessonCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AttendanceHeader({
  title,
  startAt,
  endAt,
  studentCount,
  sessionCount,
  requiredLessonCount,
  completeCount,
}: {
  title: string;
  startAt: string;
  endAt: string;
  studentCount: number;
  sessionCount: number;
  requiredLessonCount: number;
  completeCount: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-document-primary">Yoklama</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {formatDateTime(startAt)} – {formatDateTime(endAt)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatPill label="Öğrenci" value={String(studentCount)} />
        {sessionCount > 0 ? <StatPill label="Ders" value={String(sessionCount)} /> : null}
        {sessionCount > 0 ? (
          <StatPill label="Zorunlu katılım" value={`${requiredLessonCount} ders`} />
        ) : null}
        {sessionCount > 0 ? (
          <StatPill label="F03 için hazır" value={`${completeCount}/${studentCount}`} />
        ) : null}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </span>
  );
}

function StatusButtonGroup({
  status,
  disabled,
  onSelect,
}: {
  status: AttendanceStatus | null;
  disabled: boolean;
  onSelect: (status: AttendanceStatus) => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-1.5">
      {STATUS_OPTIONS.map((option) => {
        const selected = status === option;
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              selected
                ? STATUS_STYLES[option]
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {ATTENDANCE_STATUS_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}

function StatusReadonly({ status }: { status: AttendanceStatus | null }) {
  if (!status) {
    return <span className="text-sm text-slate-400">İşaretlenmedi</span>;
  }

  return (
    <span
      className={`inline-flex rounded-lg border px-3 py-2 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {ATTENDANCE_STATUS_LABELS[status]}
    </span>
  );
}

function OverviewCell({ status }: { status: AttendanceStatus | null }) {
  if (!status) {
    return <span className="text-slate-300">·</span>;
  }

  const short: Record<AttendanceStatus, string> = {
    present: "G",
    absent: "Y",
    excused: "İ",
  };

  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${STATUS_STYLES[status]}`}
      title={ATTENDANCE_STATUS_LABELS[status]}
    >
      {short[status]}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
      {message}
    </div>
  );
}

function EmptyScheduleRoster({ students }: { students: EventAttendanceSheet["students"] }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-slate-900">Kayıtlı öğrenciler</h2>
        <p className="text-sm text-slate-500">{students.length} kayıt</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {students.map((row, index) => (
          <li key={row.enrollmentId} className="flex items-center gap-3 px-5 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-slate-900">{row.studentName}</p>
              <p className="text-sm text-slate-500">{row.studentContact}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
