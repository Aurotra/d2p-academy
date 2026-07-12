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
}

export function EventCard({ event }: EventCardProps) {
  const start = formatEventDateParts(event.startAt);
  const timeRange = formatEventTimeRange(event.startAt, event.endAt);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex min-w-16 flex-col items-center rounded-2xl bg-sky-500 px-3 py-3 text-center text-white">
            <span className="text-2xl font-black leading-none">{start.day}</span>
            <span className="mt-1 text-xs uppercase tracking-wide text-sky-100">{start.month}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge tone="cyan">{EVENT_TYPE_LABELS[event.eventType]}</Badge>
              {event.category ? (
                <Badge tone="navy" style={{ backgroundColor: event.category.color }}>
                  {event.category.name}
                </Badge>
              ) : null}
              {event.isOnline ? <Badge tone="neutral">Online</Badge> : null}
            </div>
            <h3 className="mt-3 text-lg font-bold text-navy-950">{event.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {event.description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span>{timeRange}</span>
          <span>{event.isOnline ? "Çevrimiçi" : (event.locationName ?? "Konum belirtilecek")}</span>
        </div>

        <div className="mt-4">
          <EventEnrollButton eventId={event.id} />
        </div>
      </div>
    </article>
  );
}
