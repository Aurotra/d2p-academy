import type { AcademyEvent } from "@/core/domain/event";
import { EVENT_TYPE_LABELS } from "@/core/domain/event";
import { formatTryCentsAsIyzicoPrice } from "@/core/domain/payment";
import type { EventPaymentMode } from "@/infrastructure/events/event-payment-mode";
import { eventPublicPriceTryCents } from "@/infrastructure/events/event-payment-mode";
import { SITE_NAME, SITE_URL } from "@/shared/constants/site";
import { absoluteUrl } from "@/shared/seo/metadata";
import { eventLocationLabel } from "@/shared/utils/event-format";

interface EventJsonLdProps {
  event: AcademyEvent;
}

/** Omit Offer when external has no display price — price=0 would look like a free event. */
export function eventJsonLdOffer(
  event: {
    paymentMode: EventPaymentMode;
    priceTryCents?: number | null;
    displayPriceTryCents?: number | null;
  },
  eventUrl: string,
): Record<string, unknown> | undefined {
  const publicPrice = eventPublicPriceTryCents(event);
  if (publicPrice != null) {
    return {
      "@type": "Offer",
      url: eventUrl,
      availability: "https://schema.org/InStock",
      price: formatTryCentsAsIyzicoPrice(publicPrice),
      priceCurrency: "TRY",
    };
  }
  if (event.paymentMode === "free") {
    return {
      "@type": "Offer",
      url: eventUrl,
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "TRY",
    };
  }
  return undefined;
}

export function EventJsonLd({ event }: EventJsonLdProps) {
  const eventUrl = absoluteUrl(`/etkinlikler/${event.slug}`);
  const location = eventLocationLabel(event);
  const offers = eventJsonLdOffer(event, eventUrl);

  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startAt.toISOString(),
    endDate: event.endAt.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: event.isOnline
      ? {
          "@type": "VirtualLocation",
          url: eventUrl,
        }
      : {
          "@type": "Place",
          name: location,
          address: {
            "@type": "PostalAddress",
            addressLocality: location,
            addressCountry: "TR",
          },
        },
    image: event.coverImageUrl ? [event.coverImageUrl] : undefined,
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(offers ? { offers } : {}),
    about: EVENT_TYPE_LABELS[event.eventType],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
