import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AdminEventRecord,
  CreateEventInput,
  EventCategoryOption,
  EventStatus,
  UpdateEventInput,
} from "@/core/domain/admin-event";
import type { EventType } from "@/core/domain/event";
import type { AdminEventRepository } from "@/core/use-cases/manage-admin-events";
import { slugify } from "@/shared/utils/slugify";
import { normalizeProgramCode } from "@/shared/utils/program-code";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

interface EventRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_type: EventType;
  category_id: string | null;
  start_at: string;
  end_at: string;
  location_name: string | null;
  is_online: boolean;
  meeting_url: string | null;
  max_capacity: number | null;
  status: EventStatus;
  program_code: string | null;
  cover_image_url: string | null;
  event_categories: { name: string } | { name: string }[] | null;
}

function mapEvent(row: EventRow): AdminEventRecord {
  const category = Array.isArray(row.event_categories)
    ? (row.event_categories[0] ?? null)
    : row.event_categories;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    eventType: row.event_type,
    categoryId: row.category_id,
    categoryName: category?.name ?? null,
    startAt: new Date(row.start_at),
    endAt: new Date(row.end_at),
    locationName: row.location_name,
    isOnline: row.is_online,
    meetingUrl: row.meeting_url,
    maxCapacity: row.max_capacity,
    status: row.status,
    programCode: row.program_code,
    coverImageUrl: row.cover_image_url,
  };
}

function buildUniqueSlug(title: string, existingSlug?: string): string {
  const base = slugify(title) || "etkinlik";
  return existingSlug ?? `${base}-${Date.now().toString(36)}`;
}

export class SupabaseAdminEventRepository implements AdminEventRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listCategories(): Promise<EventCategoryOption[]> {
    const { data, error } = await this.client
      .from("event_categories")
      .select("id, name, slug")
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(`Kategoriler alınamadı: ${error.message}`);
    }

    return data as EventCategoryOption[];
  }

  async listAll(): Promise<AdminEventRecord[]> {
    const { data, error } = await this.client
      .from("events")
      .select(
        `
        id,
        title,
        slug,
        description,
        event_type,
        category_id,
        start_at,
        end_at,
        location_name,
        is_online,
        meeting_url,
        max_capacity,
        status,
        program_code,
        cover_image_url,
        event_categories ( name )
      `,
      )
      .order("start_at", { ascending: false });

    if (error) {
      throw new Error(`Etkinlikler alınamadı: ${error.message}`);
    }

    return (data as EventRow[]).map(mapEvent);
  }

  async create(input: CreateEventInput): Promise<AdminEventRecord> {
    const slug = buildUniqueSlug(input.title);
    const programCode =
      input.programCode === undefined || input.programCode === null
        ? null
        : normalizeProgramCode(input.programCode);

    const { data, error } = await this.client
      .from("events")
      .insert({
        title: input.title.trim(),
        slug,
        description: input.description.trim(),
        event_type: input.eventType,
        category_id: input.categoryId,
        start_at: input.startAt,
        end_at: input.endAt,
        location_name: input.locationName,
        is_online: input.isOnline,
        meeting_url: input.meetingUrl,
        max_capacity: input.maxCapacity,
        status: input.status,
        program_code: programCode,
      })
      .select(
        `
        id,
        title,
        slug,
        description,
        event_type,
        category_id,
        start_at,
        end_at,
        location_name,
        is_online,
        meeting_url,
        max_capacity,
        status,
        program_code,
        cover_image_url,
        event_categories ( name )
      `,
      )
      .single();

    if (error || !data) {
      throw new Error(`Etkinlik oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    return mapEvent(data as EventRow);
  }

  async update(input: UpdateEventInput): Promise<AdminEventRecord> {
    const payload: Record<string, string | number | boolean | null> = {};

    if (input.title !== undefined) payload.title = input.title.trim();
    if (input.description !== undefined) payload.description = input.description.trim();
    if (input.eventType !== undefined) payload.event_type = input.eventType;
    if (input.categoryId !== undefined) payload.category_id = input.categoryId;
    if (input.startAt !== undefined) payload.start_at = input.startAt;
    if (input.endAt !== undefined) payload.end_at = input.endAt;
    if (input.locationName !== undefined) payload.location_name = input.locationName;
    if (input.isOnline !== undefined) payload.is_online = input.isOnline;
    if (input.meetingUrl !== undefined) payload.meeting_url = input.meetingUrl;
    if (input.maxCapacity !== undefined) payload.max_capacity = input.maxCapacity;
    if (input.status !== undefined) payload.status = input.status;
    if (input.programCode !== undefined) {
      payload.program_code =
        input.programCode === null ? null : normalizeProgramCode(input.programCode);
    }

    const { data, error } = await this.client
      .from("events")
      .update(payload)
      .eq("id", input.id)
      .select(
        `
        id,
        title,
        slug,
        description,
        event_type,
        category_id,
        start_at,
        end_at,
        location_name,
        is_online,
        meeting_url,
        max_capacity,
        status,
        program_code,
        cover_image_url,
        event_categories ( name )
      `,
      )
      .single();

    if (error || !data) {
      throw new Error(`Etkinlik güncellenemedi: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    return mapEvent(data as EventRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("events").delete().eq("id", id);

    if (error) {
      throw new Error(`Etkinlik silinemedi: ${error.message}`);
    }
  }
}
