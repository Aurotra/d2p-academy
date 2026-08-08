import { RemoteImage } from "@/presentation/components/ui/remote-image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EVENT_TYPE_LABELS } from "@/core/domain/event";
import { SupabaseEventRepository } from "@/infrastructure/repositories/supabase-event-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { EventEnrollButton } from "@/presentation/components/events/event-enroll-button";
import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { EventJsonLd } from "@/presentation/components/seo/event-json-ld";
import { Badge } from "@/presentation/components/ui/badge";
import { eventsPageMetadata } from "@/shared/seo/public-pages";
import { BRAND_ACCENT_CARD_STYLES } from "@/shared/constants/brand-surfaces";
import { publicPageMetadata } from "@/shared/seo/metadata";
import {
  eventLocationLabel,
  formatEventDateTimeRange,
} from "@/shared/utils/event-format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const client = await createSupabaseServerClient();

  if (!client) {
    return eventsPageMetadata;
  }

  const event = await new SupabaseEventRepository(client).getPublishedBySlug(slug);

  if (!event) {
    return { title: "Etkinlik bulunamadı" };
  }

  const location = eventLocationLabel(event);
  const eventTypeLabel = EVENT_TYPE_LABELS[event.eventType].toLowerCase();
  const description =
    event.description.trim() ||
    `${event.title} — ${location}. Denizli'de D2P Academy ${eventTypeLabel} atölye programı; kayıt ve tarih bilgileri.`;

  return publicPageMetadata({
    title: `${event.title} — Denizli Atölye Etkinliği`,
    description: description.slice(0, 160),
    path: `/etkinlikler/${slug}`,
    keywords: [
      event.title,
      `${eventTypeLabel} atölyesi`,
      "Denizli çocuk etkinliği",
      "D2P Academy kayıt",
      location,
    ],
  });
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await createSupabaseServerClient();

  if (!client) {
    notFound();
  }

  const event = await new SupabaseEventRepository(client).getPublishedBySlug(slug);

  if (!event) {
    notFound();
  }

  const location = eventLocationLabel(event);
  const schedule = formatEventDateTimeRange(event.startAt, event.endAt);

  return (
    <>
      <EventJsonLd event={event} />

      <PublicPageShell>
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-document-primary">
            <Link href="/etkinlikler" className="hover:underline">
              ← Tüm etkinlikler
            </Link>
          </p>

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-secondary/15 bg-white/95 shadow-lg shadow-secondary/10">
            {event.coverImageUrl ? (
              <div className="relative aspect-[21/9] overflow-hidden bg-surface-section">
                <RemoteImage
                  src={event.coverImageUrl}
                  alt={`${event.title} etkinlik kapak görseli`}
                  fill
                  priority
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge tone="cyan">{EVENT_TYPE_LABELS[event.eventType]}</Badge>
                {event.category ? (
                  <Badge tone="navy" style={{ backgroundColor: event.category.color }}>
                    {event.category.name}
                  </Badge>
                ) : null}
                {event.isOnline ? <Badge tone="neutral">Online</Badge> : null}
              </div>

              <h1 className="mt-4 text-3xl font-bold text-navy-950 sm:text-4xl">{event.title}</h1>

              <dl
                className={`mt-6 grid gap-4 rounded-2xl p-5 text-sm text-[var(--text-on-surface-soft)] sm:grid-cols-2 ${BRAND_ACCENT_CARD_STYLES.secondary}`}
              >
                <div>
                  <dt className="font-semibold text-navy-950">Tarih ve saat</dt>
                  <dd className="mt-1">{schedule}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy-950">Konum</dt>
                  <dd className="mt-1">{location}</dd>
                </div>
              </dl>

              {event.description ? (
                <div className="prose prose-slate mt-8 max-w-none">
                  <h2 className="text-lg font-bold text-navy-950">Program hakkında</h2>
                  <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-muted">
                    {event.description}
                  </p>
                </div>
              ) : null}

              <div className="mt-8 max-w-sm">
                <EventEnrollButton eventId={event.id} />
              </div>
            </div>
          </div>
        </div>
      </PublicPageShell>
    </>
  );
}
