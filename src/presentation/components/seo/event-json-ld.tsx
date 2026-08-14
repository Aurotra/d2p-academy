import type { AcademyEvent } from "@/core/domain/event";
import { EVENT_TYPE_LABELS } from "@/core/domain/event";
import { formatTryCentsAsIyzicoPrice } from "@/core/domain/payment";
import { eventPublicPriceTryCents } from "@/infrastructure/events/event-payment-mode";
import { SITE_NAME, SITE_URL } from "@/shared/constants/site";
import { absoluteUrl } from "@/shared/seo/metadata";
import { eventLocationLabel } from "@/shared/utils/event-format";

interface EventJsonLdProps {
  event: AcademyEvent;
}

export function EventJsonLd({ event }: EventJsonLdProps) {
  const eventUrl = absoluteUrl(`/etkinlikler/${event.slug}`);
  const location = eventLocationLabel(event);
  const publicPrice = eventPublicPriceTryCents(event);
  const price =
    publicPrice != null ? formatTryCentsAsIyzicoPrice(publicPrice) : "0";

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
    offers: {
      "@type": "Offer",
      url: eventUrl,
      availability: "https://schema.org/InStock",
      price,
      priceCurrency: "TRY",
    },
    about: EVENT_TYPE_LABELS[event.eventType],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
