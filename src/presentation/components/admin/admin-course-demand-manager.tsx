"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  COURSE_DEMAND_STATUS_LABELS,
  type CourseDemandRequest,
} from "@/core/domain/course-demand";
import { getProgramCodeLabel, PROGRAM_CODE_OPTIONS } from "@/shared/constants/program-codes";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";

interface DemandGroup {
  programCode: string;
  label: string;
  durationLabel?: string | null;
  entries: Array<CourseDemandRequest & { programDurationLabel?: string | null }>;
}

interface EventOption {
  id: string;
  title: string;
  programCode: string | null;
  startAt: string;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00`));
}

function daysBetween(a: string, b: string): number {
  const start = new Date(`${a}T12:00:00`).getTime();
  const end = new Date(`${b}T12:00:00`).getTime();
  return Math.abs(Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

function isNearWindow(entry: CourseDemandRequest, anchorDate: string | null): boolean {
  if (!anchorDate) return false;
  return daysBetween(entry.preferredStartDate, anchorDate) <= 14;
}

export function AdminCourseDemandManager() {
  const [grouped, setGrouped] = useState<DemandGroup[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [programFilter, setProgramFilter] = useState("");
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [convertedEventId, setConvertedEventId] = useState<string | null>(null);

  const [mode, setMode] = useState<"new" | "existing">("new");
  const [existingEventId, setExistingEventId] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventProgramCode, setEventProgramCode] = useState("DC");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventCapacity, setEventCapacity] = useState("20");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (programFilter) params.set("program_code", programFilter);
    if (startFilter) params.set("start_date", startFilter);
    if (endFilter) params.set("end_date", endFilter);

    try {
      const [demandResponse, eventsResponse] = await Promise.all([
        fetch(`/api/v1/admin/course-demand?${params.toString()}`),
        fetch("/api/v1/admin/events"),
      ]);

      const demandPayload = (await demandResponse.json()) as {
        data?: { grouped: DemandGroup[] };
        error?: string;
      };
      const eventsPayload = (await eventsResponse.json()) as {
        data?: Array<{
          id: string;
          title: string;
          programCode: string | null;
          startAt: string;
        }>;
      };

      if (!demandResponse.ok) {
        throw new Error(demandPayload.error ?? "Talepler alınamadı.");
      }

      setGrouped(demandPayload.data?.grouped ?? []);
      setEvents(
        (eventsPayload.data ?? []).map((event) => ({
          id: event.id,
          title: event.title,
          programCode: event.programCode,
          startAt: event.startAt,
        })),
      );
      setSelectedIds(new Set());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Yükleme hatası.");
    } finally {
      setIsLoading(false);
    }
  }, [programFilter, startFilter, endFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const allEntries = useMemo(
    () => grouped.flatMap((group) => group.entries),
    [grouped],
  );

  const selectedEntries = useMemo(
    () => allEntries.filter((entry) => selectedIds.has(entry.id)),
    [allEntries, selectedIds],
  );

  const anchorDate = selectedEntries[0]?.preferredStartDate ?? null;

  const selectedWithProfile = selectedEntries.filter((entry) => !entry.needsStudentProfile);
  const selectedWithoutProfile = selectedEntries.filter((entry) => entry.needsStudentProfile);

  function toggleSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openConvertModal() {
    if (selectedIds.size === 0) return;

    const primaryProgram = selectedEntries[0]?.programCode ?? "DC";
    setEventProgramCode(primaryProgram);
    setEventTitle(`${getProgramCodeLabel(primaryProgram)} Sınıfı`);
    setEventStartDate(selectedEntries[0]?.preferredStartDate ?? "");
    setEventEndDate(
      selectedEntries[0]?.preferredEndDate ?? selectedEntries[0]?.preferredStartDate ?? "",
    );
    setShowModal(true);
  }

  async function convertSelected() {
    if (selectedIds.size === 0) return;

    setIsConverting(true);
    setError(null);
    setMessage(null);
    setConvertedEventId(null);

    try {
      const body =
        mode === "existing" && existingEventId
          ? {
              demand_request_ids: Array.from(selectedIds),
              event: {
                id: existingEventId,
                program_code: eventProgramCode,
                start_date: eventStartDate,
                end_date: eventEndDate,
                capacity: eventCapacity ? Number(eventCapacity) : null,
              },
            }
          : {
              demand_request_ids: Array.from(selectedIds),
              event: {
                program_code: eventProgramCode,
                start_date: eventStartDate,
                end_date: eventEndDate,
                title: eventTitle,
                capacity: eventCapacity ? Number(eventCapacity) : null,
              },
            };

      const response = await fetch("/api/v1/admin/course-demand/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: { eventId?: string; converted?: number; grouped?: number; skipped?: number };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Dönüştürme başarısız.");
      }

      const converted = payload.data?.converted ?? 0;
      const groupedCount = payload.data?.grouped ?? 0;
      const eventId = payload.data?.eventId ?? null;
      setConvertedEventId(eventId);
      setMessage(
        `${converted} kayıt oluşturuldu${groupedCount > 0 ? `, ${groupedCount} talep profil bekliyor` : ""}.`,
      );
      setShowModal(false);
      await loadData();
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : "Dönüştürme hatası.");
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kurs Talepleri</h1>
          <p className="mt-1 text-sm text-slate-600">
            Velilerin bıraktığı program ve tarih tercihlerini gruplayıp yeni sınıf oluşturun.
          </p>
        </div>
        <Button type="button" disabled={selectedIds.size === 0} onClick={openConvertModal}>
          Seçilenlerden Sınıf Oluştur ({selectedIds.size})
        </Button>
      </div>

      <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-4">
        <Select
          label="Program filtresi"
          value={programFilter}
          onChange={(event) => setProgramFilter(event.target.value)}
        >
          <option value="">Tümü</option>
          {PROGRAM_CODE_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          label="Başlangıç (min)"
          type="date"
          value={startFilter}
          onChange={(event) => setStartFilter(event.target.value)}
        />
        <Input
          label="Başlangıç (max)"
          type="date"
          value={endFilter}
          onChange={(event) => setEndFilter(event.target.value)}
        />
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={() => void loadData()}>
            Filtrele
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}{" "}
          {convertedEventId ? (
            <Link
              href={`/admin/events/${convertedEventId}/attendance`}
              className="font-semibold underline hover:text-emerald-950"
            >
              Etkinliği görüntüle →
            </Link>
          ) : null}
        </p>
      ) : null}

      {selectedWithoutProfile.length > 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {selectedWithoutProfile.length} seçili talepte öğrenci profili yok — bunlar kayda
          dönüşmez, &quot;profil gerekli&quot; olarak işaretlenir.
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-slate-600">Yükleniyor...</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-slate-600">Filtreye uyan kurs talebi yok.</p>
      ) : (
        grouped.map((group) => (
          <div
            key={group.programCode}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-navy-950">
              {group.label}{" "}
              {group.durationLabel ? (
                <span className="text-sm font-normal text-slate-500">({group.durationLabel})</span>
              ) : null}{" "}
              <span className="text-sm font-normal text-slate-500">({group.entries.length})</span>
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-2" />
                    <th className="px-3 py-2">Öğrenci</th>
                    <th className="px-3 py-2">Veli</th>
                    <th className="px-3 py-2">Tarih tercihi</th>
                    <th className="px-3 py-2">Program süresi</th>
                    <th className="px-3 py-2">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {group.entries.map((entry) => {
                    const near = isNearWindow(entry, anchorDate);
                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-slate-100 ${
                          near ? "bg-amber-50/70" : ""
                        } ${entry.needsStudentProfile ? "border-l-4 border-l-amber-400" : ""}`}
                      >
                        <td className="px-3 py-3">
                          {entry.status === "pending" || entry.status === "grouped" ? (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(entry.id)}
                              onChange={() => toggleSelection(entry.id)}
                              aria-label={`${entry.studentName ?? "Öğrenci"} seç`}
                            />
                          ) : null}
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {entry.studentName ?? "—"}
                          {entry.needsStudentProfile ? (
                            <span className="mt-1 block text-xs font-semibold text-amber-800">
                              Profil eksik
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {entry.parentName ?? "—"}
                          {entry.parentEmail ? (
                            <span className="block text-xs text-slate-400">{entry.parentEmail}</span>
                          ) : null}
                          {entry.parentPhone ? (
                            <span className="block text-xs text-slate-400">{entry.parentPhone}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {formatDate(entry.preferredStartDate)}
                          {entry.preferredEndDate && entry.preferredEndDate !== entry.preferredStartDate
                            ? ` – ${formatDate(entry.preferredEndDate)}`
                            : ""}
                        </td>
                        <td className="px-3 py-3 text-slate-500">
                          {entry.programDurationLabel ?? "—"}
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={entry.status === "pending" ? "cyan" : "neutral"}>
                            {COURSE_DEMAND_STATUS_LABELS[entry.status]}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-navy-950">Sınıf Oluştur / Sınıfa Ekle</h2>
            <p className="mt-2 text-sm text-slate-600">
              {selectedIds.size} talep seçildi
              {selectedWithProfile.length > 0
                ? ` · ${selectedWithProfile.length} kayıt oluşturulacak`
                : ""}
              {eventCapacity
                ? ` · Önerilen kapasite referansı: ${eventCapacity}`
                : ""}
            </p>

            <div className="mt-4 space-y-4">
              <Select
                label="İşlem türü"
                value={mode}
                onChange={(event) => setMode(event.target.value as "new" | "existing")}
              >
                <option value="new">Yeni etkinlik oluştur</option>
                <option value="existing">Mevcut etkinliğe ekle</option>
              </Select>

              {mode === "existing" ? (
                <Select
                  label="Mevcut etkinlik"
                  value={existingEventId}
                  onChange={(event) => setExistingEventId(event.target.value)}
                  required
                >
                  <option value="">Seçin</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} ({event.programCode ?? "kodsuz"})
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  label="Etkinlik başlığı"
                  value={eventTitle}
                  onChange={(event) => setEventTitle(event.target.value)}
                  required
                />
              )}

              <Select
                label="Program kodu"
                value={eventProgramCode}
                onChange={(event) => setEventProgramCode(event.target.value)}
              >
                {PROGRAM_CODE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Sınıf başlangıç"
                  type="date"
                  value={eventStartDate}
                  onChange={(event) => setEventStartDate(event.target.value)}
                  required
                />
                <Input
                  label="Sınıf bitiş"
                  type="date"
                  value={eventEndDate}
                  onChange={(event) => setEventEndDate(event.target.value)}
                  required
                />
              </div>

              <Input
                label="Kapasite (referans, engel değil)"
                type="number"
                min={1}
                value={eventCapacity}
                onChange={(event) => setEventCapacity(event.target.value)}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" disabled={isConverting} onClick={() => void convertSelected()}>
                {isConverting ? "Dönüştürülüyor..." : "Onayla"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                İptal
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
