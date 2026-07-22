"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface AdminFormsFiltersProps {
  events: Array<{ id: string; title: string }>;
  currentEventId: string | null;
  missingOnly: boolean;
}

export function AdminFormsFilters({ events, currentEventId, missingOnly }: AdminFormsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilters(next: { eventId?: string | null; missing?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.eventId === null) {
      params.delete("event_id");
    } else if (next.eventId) {
      params.set("event_id", next.eventId);
    }

    if (next.missing === true) {
      params.set("missing", "1");
    } else if (next.missing === false) {
      params.delete("missing");
    }

    const query = params.toString();
    router.push(query ? `/admin/forms?${query}` : "/admin/forms");
  }

  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <label className="block text-sm">
        <span className="font-semibold text-slate-900">Etkinlik filtresi</span>
        <select
          value={currentEventId ?? ""}
          onChange={(event) =>
            updateFilters({ eventId: event.target.value || null, missing: missingOnly })
          }
          className="mt-2 block w-full min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
        >
          <option value="">Tüm etkinlikler</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateFilters({ eventId: currentEventId, missing: false })}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            !missingOnly
              ? "bg-navy-950 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Tümü
        </button>
        <button
          type="button"
          onClick={() => updateFilters({ eventId: currentEventId, missing: true })}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            missingOnly
              ? "bg-rose-600 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Eksik formlar
        </button>
      </div>
    </div>
  );
}
