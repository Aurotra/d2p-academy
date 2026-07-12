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

interface EventsApiResponse {
  data: AdminEventRecord[];
}

interface CategoriesApiResponse {
  data: EventCategoryOption[];
}

const defaultForm = {
  title: "",
  description: "",
  eventType: "training" as EventType,
  categoryId: "",
  startAt: "",
  endAt: "",
  locationName: "",
  isOnline: false,
  meetingUrl: "",
  maxCapacity: "",
  status: "draft" as EventStatus,
};

function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

export function AdminEventsManager() {
  const [events, setEvents] = useState<AdminEventRecord[]>([]);
  const [categories, setCategories] = useState<EventCategoryOption[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          status: form.status,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Etkinlik oluşturulamadı.");
      }

      setForm(defaultForm);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt başarısız.");
    } finally {
      setIsSaving(false);
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

      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Silme başarısız.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Yeni Etkinlik Oluştur</h2>
        <form onSubmit={handleCreate} className="mt-6 grid gap-4 md:grid-cols-2">
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
          <div className="md:col-span-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Etkinlik Oluştur"}
            </Button>
          </div>
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
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-slate-100 p-4 hover:border-cyan-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="cyan">{EVENT_TYPE_LABELS[event.eventType]}</Badge>
                      <Badge tone="navy">{EVENT_STATUS_LABELS[event.status]}</Badge>
                    </div>
                    <h3 className="mt-2 font-semibold text-navy-950">{event.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDateTime(event.startAt)} · {event.categoryName ?? "Kategorisiz"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/enrollments?event_id=${event.id}`}
                      className="inline-flex items-center justify-center rounded-xl border-2 border-sky-800 bg-white px-5 py-3 text-sm font-semibold text-sky-950 shadow-md shadow-sky-200/60 transition hover:border-sky-900 hover:bg-sky-50"
                    >
                      Kayıtlar
                    </Link>
                    {event.status !== "published" ? (
                      <Button
                        variant="secondary"
                        onClick={() => void updateStatus(event.id, "published")}
                      >
                        Yayınla
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      className="text-navy-950"
                      onClick={() => void removeEvent(event.id)}
                    >
                      Sil
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
