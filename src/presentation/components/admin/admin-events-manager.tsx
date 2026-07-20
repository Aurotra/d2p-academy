"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import {
  EVENT_STATUS_LABELS,
  type AdminEventRecord,
  type EventCategoryOption,
  type EventStatus,
} from "@/core/domain/admin-event";
import { EVENT_TYPE_LABELS, type EventType } from "@/core/domain/event";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";
import { tryNormalizeProgramCode } from "@/shared/utils/program-code";

interface EventsApiResponse {
  data: AdminEventRecord[];
}

interface CategoriesApiResponse {
  data: EventCategoryOption[];
}

type EventFormState = {
  title: string;
  description: string;
  eventType: EventType;
  categoryId: string;
  startAt: string;
  endAt: string;
  locationName: string;
  isOnline: boolean;
  meetingUrl: string;
  maxCapacity: string;
  programCode: string;
  status: EventStatus;
};

const defaultForm: EventFormState = {
  title: "",
  description: "",
  eventType: "training",
  categoryId: "",
  startAt: "",
  endAt: "",
  locationName: "",
  isOnline: false,
  meetingUrl: "",
  maxCapacity: "",
  programCode: "",
  status: "draft",
};

function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function toDatetimeLocalValue(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function eventRecordToForm(event: AdminEventRecord): EventFormState {
  return {
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    categoryId: event.categoryId ?? "",
    startAt: toDatetimeLocalValue(event.startAt),
    endAt: toDatetimeLocalValue(event.endAt),
    locationName: event.locationName ?? "",
    isOnline: event.isOnline,
    meetingUrl: event.meetingUrl ?? "",
    maxCapacity: event.maxCapacity?.toString() ?? "",
    programCode: event.programCode ?? "",
    status: event.status,
  };
}

function buildEventPayload(form: EventFormState) {
  const trimmedProgramCode = form.programCode.trim();
  let programCode: string | null = null;

  if (trimmedProgramCode) {
    programCode = tryNormalizeProgramCode(trimmedProgramCode);
    if (!programCode) {
      throw new Error("Program kodu 2–4 harf olmalıdır (ör. KYK, DC).");
    }
  }

  return {
    title: form.title,
    description: form.description,
    eventType: form.eventType,
    categoryId: form.categoryId || null,
    startAt: new Date(form.startAt).toISOString(),
    endAt: new Date(form.endAt).toISOString(),
    locationName: form.locationName || null,
    isOnline: form.isOnline,
    meetingUrl: form.meetingUrl || null,
    maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
    programCode,
    status: form.status,
  };
}

function EventFormFields({
  form,
  setForm,
  categories,
  idPrefix,
}: {
  form: EventFormState;
  setForm: (next: EventFormState) => void;
  categories: EventCategoryOption[];
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Input
        label="Başlık"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <Select
        label="Tür"
        value={form.eventType}
        onChange={(e) => setForm({ ...form, eventType: e.target.value as EventType })}
      >
        {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <div className="md:col-span-2">
        <Textarea
          label="Açıklama"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>
      <Select
        label="Kategori"
        value={form.categoryId}
        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
      >
        <option value="">Kategori seçin</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Select
        label="Durum"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
      >
        {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Input
        label="Başlangıç"
        type="datetime-local"
        value={form.startAt}
        onChange={(e) => setForm({ ...form, startAt: e.target.value })}
        required
      />
      <Input
        label="Bitiş"
        type="datetime-local"
        value={form.endAt}
        onChange={(e) => setForm({ ...form, endAt: e.target.value })}
        required
      />
      <Input
        label="Konum"
        value={form.locationName}
        onChange={(e) => setForm({ ...form, locationName: e.target.value })}
      />
      <Input
        label="Kontenjan"
        type="number"
        min={1}
        value={form.maxCapacity}
        onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
      />
      <div>
        <Input
          label="Program kodu"
          value={form.programCode}
          onChange={(e) => setForm({ ...form, programCode: e.target.value.toUpperCase() })}
          placeholder="ör. KYK"
          maxLength={4}
        />
        <p className="mt-1 text-xs text-slate-500" id={`${idPrefix}-program-code-hint`}>
          Öğrenci ve sertifika kodu için zorunlu (2–4 harf, ör. KYK, DC).
        </p>
      </div>
      <Input
        label="Online Toplantı URL"
        value={form.meetingUrl}
        onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
      />
      <label className="flex items-center gap-2 text-sm text-navy-900 md:col-span-2">
        <input
          type="checkbox"
          checked={form.isOnline}
          onChange={(e) => setForm({ ...form, isOnline: e.target.checked })}
        />
        Online etkinlik
      </label>
    </div>
  );
}

export function AdminEventsManager() {
  const [events, setEvents] = useState<AdminEventRecord[]>([]);
  const [categories, setCategories] = useState<EventCategoryOption[]>([]);
  const [createForm, setCreateForm] = useState(defaultForm);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [eventsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/v1/admin/events"),
        fetch("/api/v1/admin/event-categories"),
      ]);

      const eventsPayload = (await eventsResponse.json()) as EventsApiResponse | { error: string };
      const categoriesPayload = (await categoriesResponse.json()) as
        | CategoriesApiResponse
        | { error: string };

      if (!eventsResponse.ok || "error" in eventsPayload) {
        throw new Error("error" in eventsPayload ? eventsPayload.error : "Etkinlikler alınamadı.");
      }

      if (!categoriesResponse.ok || "error" in categoriesPayload) {
        throw new Error(
          "error" in categoriesPayload ? categoriesPayload.error : "Kategoriler alınamadı.",
        );
      }

      setEvents(eventsPayload.data);
      setCategories(categoriesPayload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Veri yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function startEditing(event: AdminEventRecord) {
    setEditingEventId(event.id);
    setEditForm(eventRecordToForm(event));
    setError(null);
  }

  function cancelEditing() {
    setEditingEventId(null);
    setEditForm(null);
  }

  async function handleCreate(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = buildEventPayload(createForm);
      const response = await fetch("/api/v1/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(responsePayload.error ?? "Etkinlik oluşturulamadı.");
      }

      setCreateForm(defaultForm);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!editingEventId || !editForm) return;

    setSavingEventId(editingEventId);
    setError(null);

    try {
      const payload = buildEventPayload(editForm);
      const response = await fetch(`/api/v1/admin/events/${editingEventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(responsePayload.error ?? "Etkinlik güncellenemedi.");
      }

      cancelEditing();
      await loadData();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Güncelleme başarısız.");
    } finally {
      setSavingEventId(null);
    }
  }

  async function updateStatus(id: string, status: EventStatus) {
    setError(null);

    try {
      const response = await fetch(`/api/v1/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Durum güncellenemedi.");
      }

      await loadData();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Güncelleme başarısız.");
    }
  }

  async function removeEvent(id: string) {
    if (!window.confirm("Bu etkinliği silmek istediğinize emin misiniz?")) return;

    try {
      const response = await fetch(`/api/v1/admin/events/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Silme başarısız.");
      }

      if (editingEventId === id) {
        cancelEditing();
      }

      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Silme başarısız.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Yeni Etkinlik Oluştur</h2>
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <EventFormFields
            form={createForm}
            setForm={setCreateForm}
            categories={categories}
            idPrefix="create"
          />
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : "Etkinlik Oluştur"}
          </Button>
        </form>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Etkinlik Listesi</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Yükleniyor...</p>
        ) : events.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Henüz etkinlik yok.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {events.map((event) => {
              const isEditing = editingEventId === event.id && editForm;

              return (
                <div
                  key={event.id}
                  className="rounded-2xl border border-slate-100 p-4 hover:border-cyan-200"
                >
                  {isEditing ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-navy-950">Etkinliği Düzenle</h3>
                        <Button type="button" variant="ghost" onClick={cancelEditing}>
                          İptal
                        </Button>
                      </div>
                      <EventFormFields
                        form={editForm}
                        setForm={setEditForm}
                        categories={categories}
                        idPrefix={`edit-${event.id}`}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={savingEventId === event.id}>
                          {savingEventId === event.id ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </Button>
                        <Link
                          href={`/admin/enrollments?event_id=${event.id}`}
                          className="inline-flex items-center justify-center rounded-xl border-2 border-sky-800 bg-white px-5 py-3 text-sm font-semibold text-sky-950 shadow-md shadow-sky-200/60 transition hover:border-sky-900 hover:bg-sky-50"
                        >
                          Kayıtlar
                        </Link>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="cyan">{EVENT_TYPE_LABELS[event.eventType]}</Badge>
                          <Badge tone="navy">{EVENT_STATUS_LABELS[event.status]}</Badge>
                          {event.programCode ? (
                            <Badge tone="cyan">Kod: {event.programCode}</Badge>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                              Kod eksik
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 font-semibold text-navy-950">{event.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDateTime(event.startAt)} – {formatDateTime(event.endAt)} ·{" "}
                          {event.categoryName ?? "Kategorisiz"}
                        </p>
                        {event.locationName ? (
                          <p className="mt-1 text-sm text-slate-500">{event.locationName}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => startEditing(event)}>
                          Düzenle
                        </Button>
                        <Link
                          href={`/admin/enrollments?event_id=${event.id}`}
                          className="inline-flex items-center justify-center rounded-xl border-2 border-sky-800 bg-white px-5 py-3 text-sm font-semibold text-sky-950 shadow-md shadow-sky-200/60 transition hover:border-sky-900 hover:bg-sky-50"
                        >
                          Kayıtlar
                        </Link>
                        {event.status === "published" ? (
                          <Button
                            variant="secondary"
                            onClick={() => void updateStatus(event.id, "draft")}
                          >
                            Yayından Kaldır
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() => void updateStatus(event.id, "published")}
                          >
                            Yayınla
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          className="text-navy-950"
                          onClick={() => void removeEvent(event.id)}
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
