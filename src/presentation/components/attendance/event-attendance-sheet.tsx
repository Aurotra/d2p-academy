"use client";

import { useMemo, useState } from "react";

import type { AttendanceStatus, EventAttendanceSheet } from "@/core/domain/event-attendance";
import { ATTENDANCE_STATUS_LABELS } from "@/core/domain/event-attendance";
import { formatAttendanceDateLabel } from "@/shared/utils/event-attendance-dates";
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
  const [selectedDate, setSelectedDate] = useState(sheet.dates[0] ?? "");

  const selectedDateLabel = useMemo(
    () => (selectedDate ? formatAttendanceDateLabel(selectedDate) : ""),
    [selectedDate],
  );

  async function saveStatus(enrollmentId: string, attendanceDate: string, status: AttendanceStatus) {
    const key = `${enrollmentId}:${attendanceDate}`;
    setPendingKey(key);
    setError(null);

    try {
      const response = await fetch(`${apiBasePath}/${sheet.eventId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, attendanceDate, status }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Yoklama kaydedilemedi.");
      }

      setRows((current) =>
        current.map((row) =>
          row.enrollmentId === enrollmentId
            ? {
                ...row,
                attendance: {
                  ...row.attendance,
                  [attendanceDate]: status,
                },
                enrollmentStatus:
                  status === "present" && row.enrollmentStatus === "registered"
                    ? "attended"
                    : row.enrollmentStatus,
              }
            : row,
        ),
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt başarısız.");
    } finally {
      setPendingKey(null);
    }
  }

  if (sheet.dates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600">
        Etkinlik tarih aralığı geçersiz; yoklama günleri oluşturulamadı.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Yoklama
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{sheet.eventTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {formatDateTime(sheet.startAt)} – {formatDateTime(sheet.endAt)} · {sheet.dates.length} gün
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Etkinlik planındaki her gün için öğrencinin gelip gelmediğini işaretleyin. Hücreye
          tıklayarak durumu değiştirin: Geldi → Gelmedi → İzinli.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sheet.dates.map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => setSelectedDate(date)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedDate === date
                ? "bg-document-primary text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {formatAttendanceDateLabel(date)}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{selectedDateLabel}</h2>
          <p className="mt-1 text-sm text-slate-500">{rows.length} kayıtlı öğrenci</p>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Bu etkinlikte kayıtlı öğrenci yok.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => {
              const status = row.attendance[selectedDate] ?? null;
              const key = `${row.enrollmentId}:${selectedDate}`;
              const isPending = pendingKey === key;

              return (
                <li
                  key={row.enrollmentId}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{row.studentName}</p>
                    <p className="text-sm text-slate-500">{row.studentContact}</p>
                  </div>

                  {sheet.canEdit ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => void saveStatus(row.enrollmentId, selectedDate, nextStatus(status))}
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

      <div className="overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Öğrenci</th>
              {sheet.dates.map((date) => (
                <th key={date} className="px-3 py-3 text-center font-semibold">
                  {formatAttendanceDateLabel(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.enrollmentId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{row.studentName}</td>
                {sheet.dates.map((date) => {
                  const status = row.attendance[date] ?? null;
                  return (
                    <td key={date} className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          status ? STATUS_STYLES[status] : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {status ? ATTENDANCE_STATUS_LABELS[status][0] : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
