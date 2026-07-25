import type { SupabaseClient } from "@supabase/supabase-js";

import type { AcademyEvent, EventCategory, EventType } from "@/core/domain/event";
import type { EventRepository } from "@/core/use-cases/list-upcoming-events";

interface EventCategoryRow {
  id: string;
  name: string;
  slug: string;
  color: string;
}

const EVENT_SELECT = `
        id,
        title,
        slug,
        description,
        event_type,
        start_at,
        end_at,
        location_name,
        is_online,
        cover_image_url,
        event_categories (
          id,
          name,
          slug,
          color
        )
      `;

interface EventRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_type: EventType;
  start_at: string;
  end_at: string;
  location_name: string | null;
  is_online: boolean;
  cover_image_url: string | null;
  event_categories: EventCategoryRow | EventCategoryRow[] | null;
}

function mapCategory(row: EventCategoryRow | null): EventCategory | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
  };
}

function mapEvent(row: EventRow): AcademyEvent {
  const categoryRow = Array.isArray(row.event_categories)
    ? (row.event_categories[0] ?? null)
    : row.event_categories;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    eventType: row.event_type,
    category: mapCategory(categoryRow),
    startAt: new Date(row.start_at),
    endAt: new Date(row.end_at),
    locationName: row.location_name,
    isOnline: row.is_online,
    coverImageUrl: row.cover_image_url,
  };
}

export class SupabaseEventRepository implements EventRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listUpcoming(limit: number): Promise<AcademyEvent[]> {
    const { data, error } = await this.client
      .from("events")
      .select(EVENT_SELECT)
      .eq("status", "published")
      .gte("end_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch upcoming events: ${error.message}`);
    }

    return (data as EventRow[]).map(mapEvent);
  }

  async listPublishedUpcoming(limit = 50): Promise<AcademyEvent[]> {
    return this.listUpcoming(limit);
  }

  async getPublishedBySlug(slug: string): Promise<AcademyEvent | null> {
    const { data, error } = await this.client
      .from("events")
      .select(EVENT_SELECT)
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Etkinlik alınamadı: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapEvent(data as EventRow);
  }

  async listPublishedSlugs(): Promise<Array<{ slug: string; updatedAt: Date }>> {
    const { data, error } = await this.client
      .from("events")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("start_at", { ascending: false });

    if (error) {
      throw new Error(`Etkinlik listesi alınamadı: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      slug: row.slug as string,
      updatedAt: new Date(row.updated_at as string),
    }));
  }
}
