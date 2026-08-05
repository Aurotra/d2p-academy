"use client";

import { useMemo, useState } from "react";

import type { AttendanceStatus, EventAttendanceSheet } from "@/core/domain/event-attendance";
import { ATTENDANCE_STATUS_LABELS } from "@/core/domain/event-attendance";
import { formatEventAttendanceWindowLabel } from "@/shared/utils/event-attendance-window";
import { Button } from "@/presentation/components/ui/button";

const STATUS_CYCLE: AttendanceStatus[] = ["present", "absent", "excused"];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800 border-emerald-300",
  absent: "bg-rose-100 text-rose-800 border-rose-300",
  excused: "bg-amber-100 text-amber-900 border-amber-300",
};

interface EventAttendanceSheetProps {
  sheet: EventAttendanceSheet;
  apiBasePath: string;
}

function nextStatus(current: AttendanceStatus | null): AttendanceStatus {
  if (!current) {
    return "present";
  }
  const index = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
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
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState(sheet.sessions[0]?.id ?? "");

  const selectedSession = useMemo(
    () => sheet.sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sheet.sessions, selectedSessionId],
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

  if (sheet.sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            Kayıtlılar
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{sheet.eventTitle}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {formatDateTime(sheet.startAt)} – {formatDateTime(sheet.endAt)}
          </p>
        </div>

        {sheet.students.length > 0 ? (
          <RegisteredStudentsRoster students={sheet.students} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600">
            Bu etkinlikte henüz kayıtlı öğrenci yok.
          </div>
        )}

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600">
          Bu etkinlik için ders çizelgesi oluşturulamadı. Etkinlik tarihleri ve günlük ders saatlerini
          kontrol edin.
        </div>
      </div>
    );
  }

  const outsideEventWindow = !sheet.attendanceOpen;

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Yoklama
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{sheet.eventTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {formatDateTime(sheet.startAt)} – {formatDateTime(sheet.endAt)} · {sheet.totalLessonCount}{" "}
          ders · Zorunlu katılım: {sheet.requiredLessonCount}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Her ders saati için öğrencinin sınıfta olup olmadığını işaretleyin. Zorunlu ders sayısına
          ulaşan öğrencide son test (F03) otomatik açılır. Tüm işaretlemeler işlem loglarına kaydedilir.
        </p>
      </div>

      {outsideEventWindow ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Etkinlik tarihleri dışında yoklama işaretleniyor (
          {formatEventAttendanceWindowLabel(sheet.startAt, sheet.endAt)}). Bu işlemler admin loglarında
          görüntülenir.
        </div>
      ) : null}

      <RegisteredStudentsRoster students={rows} />

      <div className="flex flex-wrap gap-2">
        {sheet.sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => setSelectedSessionId(session.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedSessionId === session.id
                ? "bg-document-primary text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {session.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {selectedSession ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">{selectedSession.label}</h2>
            <p className="mt-1 text-sm text-slate-500">{rows.length} kayıtlı öğrenci</p>
          </div>

          {rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              Bu etkinlikte kayıtlı öğrenci yok.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((row) => {
                const status = row.attendance[selectedSession.id] ?? null;
                const key = `${row.enrollmentId}:${selectedSession.id}`;
                const isPending = pendingKey === key;

                return (
                  <li
                    key={row.enrollmentId}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{row.studentName}</p>
                      <p className="text-sm text-slate-500">{row.studentContact}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Katılım: {row.presentCount}/{sheet.requiredLessonCount}
                        {row.attendanceComplete ? " · Son test için uygun" : ""}
                      </p>
                    </div>

                    {sheet.canEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          void saveStatus(row.enrollmentId, selectedSession.id, nextStatus(status))
                        }
                        className={`min-w-28 border ${
                          status ? STATUS_STYLES[status] : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {isPending ? "Kaydediliyor…" : status ? ATTENDANCE_STATUS_LABELS[status] : "İşaretle"}
                      </Button>
                    ) : (
                      <span
                        className={`inline-flex min-w-28 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold ${
                          status ? STATUS_STYLES[status] : "border-slate-200 text-slate-400"
                        }`}
                      >
                        {status ? ATTENDANCE_STATUS_LABELS[status] : "—"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 font-semibold">Öğrenci</th>
              {sheet.sessions.map((session) => (
                <th key={session.id} className="min-w-28 px-2 py-3 text-center font-semibold">
                  <span className="block text-xs leading-tight">{session.label}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center font-semibold">Katılım</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.enrollmentId} className="border-t border-slate-100">
                <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-slate-900">
                  {row.studentName}
                </td>
                {sheet.sessions.map((session) => {
                  const status = row.attendance[session.id] ?? null;
                  const key = `${row.enrollmentId}:${session.id}`;
                  const isPending = pendingKey === key;

                  return (
                    <td key={session.id} className="px-2 py-2 text-center">
                      {sheet.canEdit ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            void saveStatus(row.enrollmentId, session.id, nextStatus(status))
                          }
                          className={`inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border text-xs font-bold ${
                            status ? STATUS_STYLES[status] : "border-slate-200 text-slate-400"
                          }`}
                          title={status ? ATTENDANCE_STATUS_LABELS[status] : "İşaretle"}
                        >
                          {isPending ? "…" : status ? ATTENDANCE_STATUS_LABELS[status][0] : "·"}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            status ? STATUS_STYLES[status] : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {status ? ATTENDANCE_STATUS_LABELS[status][0] : "—"}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center font-semibold text-slate-700">
                  {row.presentCount}/{sheet.requiredLessonCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegisteredStudentsRoster({
  students,
}: {
  students: EventAttendanceSheet["students"];
}) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-900">Kayıtlı öğrenciler</h2>
        <p className="mt-1 text-sm text-slate-500">{students.length} kayıt</p>
      </div>

      {students.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          Bu etkinlikte kayıtlı öğrenci yok.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {students.map((row, index) => (
            <li key={row.enrollmentId} className="flex items-start gap-4 px-5 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{row.studentName}</p>
                <p className="text-sm text-slate-500">{row.studentContact}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
