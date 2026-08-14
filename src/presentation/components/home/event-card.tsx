import Link from "next/link";

import { EVENT_TYPE_LABELS, type AcademyEvent } from "@/core/domain/event";
import { formatTryCentsDisplay } from "@/core/domain/payment";
import { EventEnrollButton } from "@/presentation/components/events/event-enroll-button";
import { Badge } from "@/presentation/components/ui/badge";
import {
  eventLocationLabel,
  formatEventDateParts,
  formatEventTimeRange,
} from "@/shared/utils/event-format";

interface EventCardProps {
  event: AcademyEvent;
  compact?: boolean;
  linkToDetail?: boolean;
}

function EventDateBadge({ day, month }: { day: string; month: string }) {
  return (
    <div className="flex min-w-16 shrink-0 flex-col items-center rounded-2xl bg-secondary px-3 py-3 text-center text-white">
      <span className="text-2xl font-black leading-none">{day}</span>
      <span className="mt-1 text-xs uppercase tracking-wide text-white/80">{month}</span>
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
      {event.isPaid && event.priceTryCents != null && event.priceTryCents > 0 ? (
        <Badge tone="neutral">{formatTryCentsDisplay(event.priceTryCents)}</Badge>
      ) : null}
    </div>
  );
}

function EventTitle({ event, linkToDetail }: { event: AcademyEvent; linkToDetail?: boolean }) {
  const title = (
    <h3 className="mt-2 text-lg font-bold text-navy-950 group-hover:text-secondary md:mt-3">
      {event.title}
    </h3>
  );

  if (!linkToDetail) {
    return title;
  }

  return (
    <Link href={`/etkinlikler/${event.slug}`} className="block">
      {title}
    </Link>
  );
}

export function EventCard({ event, compact = false, linkToDetail = false }: EventCardProps) {
  const start = formatEventDateParts(event.startAt);
  const timeRange = formatEventTimeRange(event.startAt, event.endAt);
  const locationLabel = eventLocationLabel(event);

  if (compact) {
    return (
      <article className="group overflow-hidden rounded-2xl border border-border-surface bg-surface-card shadow-sm transition hover:border-secondary/40 hover:shadow-md">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          <EventDateBadge day={start.day} month={start.month} />

          <div className="min-w-0 flex-1">
            <EventMetaBadges event={event} />
            <EventTitle event={event} linkToDetail={linkToDetail} />
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{event.description}</p>
            <p className="mt-2 text-sm text-subtle">
              {timeRange}
              <span className="mx-2 text-border-surface" aria-hidden>
                ·
              </span>
              {locationLabel}
            </p>
            {linkToDetail ? (
              <Link
                href={`/etkinlikler/${event.slug}`}
                className="mt-2 inline-block text-sm font-semibold text-document-primary hover:underline"
              >
                Detayları gör →
              </Link>
            ) : null}
          </div>

          <div className="shrink-0 sm:w-44">
            <EventEnrollButton eventId={event.id} isPaid={event.isPaid} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border-surface bg-white shadow-sm transition hover:-translate-y-1 hover:border-secondary/40 hover:shadow-xl hover:shadow-secondary/10">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <EventDateBadge day={start.day} month={start.month} />

          <div className="min-w-0 flex-1">
            <EventMetaBadges event={event} />
            <EventTitle event={event} linkToDetail={linkToDetail} />
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
              {event.description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border-surface pt-4 text-sm text-subtle">
          <span>{timeRange}</span>
          <span>{locationLabel}</span>
        </div>

        {linkToDetail ? (
          <Link
            href={`/etkinlikler/${event.slug}`}
            className="mt-3 text-sm font-semibold text-document-primary hover:underline"
          >
            Detayları gör →
          </Link>
        ) : null}

        <div className="mt-4">
          <EventEnrollButton eventId={event.id} isPaid={event.isPaid} />
        </div>
      </div>
    </article>
  );
}
