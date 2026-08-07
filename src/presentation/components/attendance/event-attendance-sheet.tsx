"use client";

import { useCallback, useMemo, useState } from "react";

import type { AttendanceStatus, EventAttendanceSheet, EventSessionColumn } from "@/core/domain/event-attendance";
import { ATTENDANCE_STATUS_LABELS } from "@/core/domain/event-attendance";
import { formatEventAttendanceWindowLabel } from "@/shared/utils/event-attendance-window";
import { formatAttendanceCertificateLabel } from "@/shared/utils/enrollment-attendance";
import { getLessonButtonPalette } from "@/shared/utils/event-lesson-colors";
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

type SessionDraft = Record<string, AttendanceStatus | null>;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function buildSessionDraft(
  rows: EventAttendanceSheet["students"],
  sessionId: string,
): SessionDraft {
  return Object.fromEntries(
    rows.map((row) => [row.enrollmentId, row.attendance[sessionId] ?? null]),
  );
}

function applyDraftToRows(
  rows: EventAttendanceSheet["students"],
  sessionId: string,
  draft: SessionDraft,
  requiredLessonCount: number,
): EventAttendanceSheet["students"] {
  return rows.map((row) => {
    const status = draft[row.enrollmentId] ?? row.attendance[sessionId] ?? null;
    const attendance = {
      ...row.attendance,
      [sessionId]: status,
    };
    const presentCount = Object.values(attendance).filter((value) => value === "present").length;

    return {
      ...row,
      attendance,
      presentCount,
      attendanceComplete: presentCount >= requiredLessonCount,
      enrollmentStatus:
        presentCount >= requiredLessonCount && row.enrollmentStatus === "registered"
          ? "attended"
          : row.enrollmentStatus,
    };
  });
}

export function EventAttendanceSheetView({ sheet, apiBasePath }: EventAttendanceSheetProps) {
  const [rows, setRows] = useState(sheet.students);
  const [sessions, setSessions] = useState(sheet.sessions);
  const [drafts, setDrafts] = useState<Record<string, SessionDraft>>({});
  const [submitPending, setSubmitPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState(sheet.sessions[0]?.id ?? "");
  const [showOverview, setShowOverview] = useState(false);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const getSessionDraft = useCallback(
    (sessionId: string): SessionDraft => {
      if (drafts[sessionId]) {
        return drafts[sessionId];
      }
      return buildSessionDraft(rows, sessionId);
    },
    [drafts, rows],
  );

  const isSessionEditable = useCallback(
    (session: EventSessionColumn) => {
      if (!sheet.canEdit) {
        return false;
      }
      if (session.attendanceLocked && !sheet.canEditLockedSessions) {
        return false;
      }
      return true;
    },
    [sheet.canEdit, sheet.canEditLockedSessions],
  );

  const sessionDraft = selectedSession ? getSessionDraft(selectedSession.id) : {};
  const sessionEditable = selectedSession ? isSessionEditable(selectedSession) : false;

  const markedInSession = useMemo(() => {
    if (!selectedSession) {
      return 0;
    }
    const draft = getSessionDraft(selectedSession.id);
    return Object.values(draft).filter((status) => status != null).length;
  }, [getSessionDraft, selectedSession]);

  const allMarkedInSession = rows.length > 0 && markedInSession === rows.length;
  const hasDraftChanges = useMemo(() => {
    if (!selectedSession) {
      return false;
    }
    const draft = getSessionDraft(selectedSession.id);
    return rows.some((row) => (draft[row.enrollmentId] ?? null) !== (row.attendance[selectedSession.id] ?? null));
  }, [getSessionDraft, rows, selectedSession]);

  const completeStudents = useMemo(
    () => rows.filter((row) => row.attendanceComplete).length,
    [rows],
  );

  function setDraftStatus(sessionId: string, enrollmentId: string, status: AttendanceStatus) {
    setDrafts((current) => {
      const base = current[sessionId] ?? buildSessionDraft(rows, sessionId);
      const next = { ...base };
      next[enrollmentId] = next[enrollmentId] === status ? null : status;
      return { ...current, [sessionId]: next };
    });
    setError(null);
  }

  function markAllPresentDraft(sessionId: string) {
    setDrafts((current) => ({
      ...current,
      [sessionId]: Object.fromEntries(
        rows.map((row) => [row.enrollmentId, "present" as AttendanceStatus]),
      ),
    }));
    setError(null);
  }

  function resetSessionDraft(sessionId: string) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[sessionId];
      return next;
    });
    setError(null);
  }

  async function submitSession(sessionId: string) {
    const draft = getSessionDraft(sessionId);
    const marks = rows
      .map((row) => ({
        enrollmentId: row.enrollmentId,
        status: draft[row.enrollmentId] ?? null,
      }))
      .filter((mark): mark is { enrollmentId: string; status: AttendanceStatus } => mark.status != null);

    if (marks.length !== rows.length) {
      setError("Onaya göndermeden önce tüm öğrencileri işaretleyin.");
      return;
    }

    setSubmitPending(true);
    setError(null);

    try {
      const response = await fetch(`${apiBasePath}/${sheet.eventId}/attendance/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, marks }),
      });
      const payload = (await response.json()) as { error?: string; submittedAt?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Yoklama onaylanamadı.");
      }

      const submittedAt = payload.submittedAt ?? new Date().toISOString();
      setRows((current) => applyDraftToRows(current, sessionId, draft, sheet.requiredLessonCount));
      setSessions((current) =>
        current.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                attendanceLocked: true,
                attendanceSubmittedAt: submittedAt,
              }
            : session,
        ),
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[sessionId];
        return next;
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Onay başarısız.");
    } finally {
      setSubmitPending(false);
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
            Kurs {sheet.totalLessonCount} derse bölünür (her ders = 1 saat). Numaraya tıklayıp
            yoklama alın; onaya gönderince ders kilitlenir.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {sessions.map((session) => {
              const active = session.id === selectedSessionId;
              const draft = getSessionDraft(session.id);
              const sessionMarked = Object.values(draft).filter((status) => status != null).length;
              const allMarked = rows.length > 0 && sessionMarked === rows.length;
              const palette = getLessonButtonPalette(session.sessionIndex);

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`relative flex min-h-[4.5rem] flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 text-center transition ${
                    active
                      ? `${palette.solid} ring-2 ring-offset-2 ${palette.ring} shadow-md`
                      : allMarked
                        ? `${palette.soft} opacity-90`
                        : `${palette.soft} hover:shadow-sm`
                  }`}
                >
                  <span className="text-lg font-black leading-none">{session.sessionIndex}</span>
                  <span
                    className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${active ? "text-white/90" : "opacity-70"}`}
                  >
                    Ders
                  </span>
                  <span
                    className={`mt-1.5 text-[10px] font-medium ${active ? "text-white/80" : "text-slate-500"}`}
                  >
                    {sessionMarked}/{rows.length}
                  </span>
                  {session.attendanceLocked ? (
                    <span
                      className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        active ? "bg-white/20 text-white" : "bg-slate-900/10 text-slate-700"
                      }`}
                    >
                      Kilit
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {selectedSession ? (
          <div className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{selectedSession.label}</h2>
                  {selectedSession.attendanceLocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      Onaylandı
                      {selectedSession.attendanceSubmittedAt
                        ? ` · ${formatDateTime(selectedSession.attendanceSubmittedAt)}`
                        : ""}
                    </span>
                  ) : hasDraftChanges ? (
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                      Kaydedilmemiş işaretler
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {markedInSession}/{rows.length} öğrenci işaretlendi
                </p>
              </div>
              {sessionEditable ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submitPending || rows.length === 0}
                    onClick={() => markAllPresentDraft(selectedSession.id)}
                    className="shrink-0"
                  >
                    Hepsini geldi işaretle
                  </Button>
                  {hasDraftChanges ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitPending}
                      onClick={() => resetSessionDraft(selectedSession.id)}
                      className="shrink-0"
                    >
                      İşaretleri sıfırla
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {selectedSession.attendanceLocked && !sheet.canEditLockedSessions ? (
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Bu ders yoklaması onaylandı ve kilitlendi. Değişiklik için yönetici ile iletişime geçin.
              </p>
            ) : null}

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
                  const status = sessionDraft[row.enrollmentId] ?? null;

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
                          Katılım:{" "}
                          {formatAttendanceCertificateLabel(
                            row.presentCount,
                            sheet.requiredLessonCount,
                            sheet.totalLessonCount,
                          )}
                          {row.attendanceComplete ? " · F03 için uygun" : ""}
                        </p>
                      </div>

                      {sessionEditable ? (
                        <StatusButtonGroup
                          status={status}
                          disabled={submitPending}
                          onSelect={(next) => setDraftStatus(selectedSession.id, row.enrollmentId, next)}
                        />
                      ) : (
                        <StatusReadonly status={status} />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {sessionEditable && rows.length > 0 ? (
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  {selectedSession.attendanceLocked
                    ? "Kilitli ders yoklamasında değişiklik yapabilirsiniz."
                    : allMarkedInSession
                      ? "Tüm öğrenciler işaretlendi. Onaya gönderince liste kilitlenir."
                      : "Onaya göndermeden önce tüm öğrencileri işaretleyin."}
                </p>
                <Button
                  type="button"
                  disabled={submitPending || !allMarkedInSession}
                  onClick={() => void submitSession(selectedSession.id)}
                  className="w-full shrink-0 sm:w-auto"
                >
                  {submitPending
                    ? "Gönderiliyor…"
                    : selectedSession.attendanceLocked
                      ? "Değişiklikleri kaydet"
                      : "Onaya gönder ve kilitle"}
                </Button>
              </div>
            ) : null}
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
                    {sessions.map((session) => {
                      const palette = getLessonButtonPalette(session.sessionIndex);
                      return (
                        <th
                          key={session.id}
                          className={`min-w-12 px-1 py-2 text-center text-xs font-bold ${palette.soft} border border-white`}
                          title={session.attendanceLocked ? "Onaylandı" : undefined}
                        >
                          {session.sessionIndex}
                          {session.attendanceLocked ? "*" : ""}
                        </th>
                      );
                    })}
                    <th className="px-2 py-2 text-center font-semibold">Katılım</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.enrollmentId} className="border-t border-slate-100">
                      <td className="sticky left-0 z-10 max-w-32 truncate bg-white px-3 py-2 font-medium text-slate-900">
                        {row.studentName}
                      </td>
                      {sessions.map((session) => {
                        const status = row.attendance[session.id] ?? null;
                        return (
                          <td key={session.id} className="px-1 py-2 text-center">
                            <OverviewCell status={status} />
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center text-xs font-semibold text-slate-700">
                        {formatAttendanceCertificateLabel(
                          row.presentCount,
                          sheet.requiredLessonCount,
                          sheet.totalLessonCount,
                        )}
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
          <StatPill label="Sertifika eşiği" value={`${requiredLessonCount}/${sessionCount}`} />
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
            title={selected ? "İşareti kaldırmak için tekrar tıklayın" : undefined}
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
