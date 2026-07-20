import { EVENT_TYPE_LABELS, type AcademyEvent } from "@/core/domain/event";
import { EventEnrollButton } from "@/presentation/components/events/event-enroll-button";
import { Badge } from "@/presentation/components/ui/badge";

const TURKEY_TIME_ZONE = "Europe/Istanbul";

function formatEventDateParts(date: Date): { day: string; month: string } {
  return {
    day: new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      timeZone: TURKEY_TIME_ZONE,
    }).format(date),
    month: new Intl.DateTimeFormat("tr-TR", {
      month: "short",
      timeZone: TURKEY_TIME_ZONE,
    }).format(date),
  };
}

function formatEventTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TURKEY_TIME_ZONE,
  }).format(date);
}

function formatEventTimeRange(startAt: Date, endAt: Date): string {
  return `${formatEventTime(startAt)} – ${formatEventTime(endAt)}`;
}

interface EventCardProps {
  event: AcademyEvent;
  compact?: boolean;
}

function EventDateBadge({ day, month }: { day: string; month: string }) {
  return (
    <div className="flex min-w-16 shrink-0 flex-col items-center rounded-2xl bg-sky-500 px-3 py-3 text-center text-white">
      <span className="text-2xl font-black leading-none">{day}</span>
      <span className="mt-1 text-xs uppercase tracking-wide text-sky-100">{month}</span>
    </div>
  );
}

function EventMetaBadges({ event }: { event: AcademyEvent }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone="cyan">{EVENT_TYPE_LABELS[event.eventType]}</Badge>
      {event.category ? (
        <Badge tone="navy" style={{ backgroundColor: event.category.color }}>
          {event.category.name}
        </Badge>
      ) : null}
      {event.isOnline ? <Badge tone="neutral">Online</Badge> : null}
    </div>
  );
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const start = formatEventDateParts(event.startAt);
  const timeRange = formatEventTimeRange(event.startAt, event.endAt);
  const locationLabel = event.isOnline ? "Çevrimiçi" : (event.locationName ?? "Konum belirtilecek");

  if (compact) {
    return (
      <article className="group overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-white to-sky-50/40 shadow-sm transition hover:border-cyan-300 hover:shadow-md">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          <EventDateBadge day={start.day} month={start.month} />

          <div className="min-w-0 flex-1">
            <EventMetaBadges event={event} />
            <h3 className="mt-2 text-lg font-bold text-navy-950">{event.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p>
            <p className="mt-2 text-sm text-slate-500">
              {timeRange}
              <span className="mx-2 text-slate-300" aria-hidden>
                ·
              </span>
              {locationLabel}
            </p>
          </div>

          <div className="shrink-0 sm:w-44">
            <EventEnrollButton eventId={event.id} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <EventDateBadge day={start.day} month={start.month} />

          <div className="min-w-0 flex-1">
            <EventMetaBadges event={event} />
            <h3 className="mt-3 text-lg font-bold text-navy-950">{event.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {event.description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span>{timeRange}</span>
          <span>{locationLabel}</span>
        </div>

        <div className="mt-4">
          <EventEnrollButton eventId={event.id} />
        </div>
      </div>
    </article>
  );
}
