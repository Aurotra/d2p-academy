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
import {
  eventPaymentWriteFields,
  resolveEventPaymentMode,
  resolvePaymentModeForWrite,
} from "@/infrastructure/events/event-payment-mode";

interface InstructorAssignmentRow {
  sort_order: number;
  instructor_id: string;
  instructor:
    | { id: string; full_name: string }
    | { id: string; full_name: string }[]
    | null;
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
  daily_lesson_start: string;
  daily_lesson_end: string;
  lesson_duration_minutes: number;
  total_lesson_count: number | null;
  required_lesson_count: number | null;
  location_name: string | null;
  is_online: boolean;
  is_paid: boolean;
  payment_mode: string | null;
  price_try_cents: number | null;
  display_price_try_cents: number | null;
  meeting_url: string | null;
  max_capacity: number | null;
  status: EventStatus;
  program_code: string | null;
  cover_image_url: string | null;
  instructor_id: string | null;
  event_categories: { name: string } | { name: string }[] | null;
  event_instructors: InstructorAssignmentRow[] | null;
}

const EVENT_SELECT = `
  id,
  title,
  slug,
  description,
  event_type,
  category_id,
  start_at,
  end_at,
  daily_lesson_start,
  daily_lesson_end,
  lesson_duration_minutes,
  total_lesson_count,
  required_lesson_count,
  location_name,
  is_online,
  is_paid,
  payment_mode,
  price_try_cents,
  display_price_try_cents,
  meeting_url,
  max_capacity,
  status,
  program_code,
  cover_image_url,
  instructor_id,
  event_categories ( name ),
  event_instructors (
    sort_order,
    instructor_id,
    instructor:profiles ( id, full_name )
  )
`;

function unwrapOne<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapInstructors(
  rows: InstructorAssignmentRow[] | null,
): Pick<AdminEventRecord, "instructorIds" | "instructorNames" | "instructorId" | "instructorName"> {
  const sorted = [...(rows ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const instructorIds: string[] = [];
  const instructorNames: string[] = [];

  for (const row of sorted) {
    const instructor = unwrapOne(row.instructor);
    instructorIds.push(row.instructor_id);
    if (instructor?.full_name) {
      instructorNames.push(instructor.full_name);
    }
  }

  return {
    instructorIds,
    instructorNames,
    instructorId: instructorIds[0] ?? null,
    instructorName: instructorNames.length > 0 ? instructorNames.join(", ") : null,
  };
}

function normalizeTimeValue(value: string): string {
  return value.slice(0, 5);
}

function mapEvent(row: EventRow): AdminEventRecord {
  const category = unwrapOne(row.event_categories);
  const instructors = mapInstructors(row.event_instructors);

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
    dailyLessonStart: normalizeTimeValue(row.daily_lesson_start ?? "09:00"),
    dailyLessonEnd: normalizeTimeValue(row.daily_lesson_end ?? "17:00"),
    lessonDurationMinutes: row.lesson_duration_minutes ?? 60,
    totalLessonCount: row.total_lesson_count,
    requiredLessonCount: row.required_lesson_count,
    locationName: row.location_name,
    isOnline: row.is_online,
    isPaid: Boolean(row.is_paid),
    paymentMode: resolveEventPaymentMode({
      paymentMode: row.payment_mode,
      isPaid: row.is_paid,
    }),
    priceTryCents: row.price_try_cents,
    displayPriceTryCents: row.display_price_try_cents,
    meetingUrl: row.meeting_url,
    maxCapacity: row.max_capacity,
    status: row.status,
    programCode: row.program_code,
    coverImageUrl: row.cover_image_url,
    ...instructors,
  };
}

function buildUniqueSlug(title: string, existingSlug?: string): string {
  const base = slugify(title) || "etkinlik";
  return existingSlug ?? `${base}-${Date.now().toString(36)}`;
}

async function syncEventSessions(client: SupabaseClient, eventId: string): Promise<void> {
  const { error } = await client.rpc("sync_event_sessions", { p_event_id: eventId });
  if (error) {
    throw new Error(`Ders çizelgesi oluşturulamadı: ${error.message}`);
  }
}

async function replaceEventInstructors(
  client: SupabaseClient,
  eventId: string,
  instructorIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(instructorIds.filter(Boolean))];

  const { error: deleteError } = await client
    .from("event_instructors")
    .delete()
    .eq("event_id", eventId);

  if (deleteError) {
    throw new Error(`Eğitmen atamaları güncellenemedi: ${deleteError.message}`);
  }

  if (uniqueIds.length === 0) {
    const { error: clearPrimaryError } = await client
      .from("events")
      .update({ instructor_id: null })
      .eq("id", eventId);

    if (clearPrimaryError) {
      throw new Error(`Eğitmen atamaları güncellenemedi: ${clearPrimaryError.message}`);
    }
    return;
  }

  const { error: insertError } = await client.from("event_instructors").insert(
    uniqueIds.map((instructorId, index) => ({
      event_id: eventId,
      instructor_id: instructorId,
      sort_order: index,
    })),
  );

  if (insertError) {
    throw new Error(`Eğitmen atamaları kaydedilemedi: ${insertError.message}`);
  }
}

export class SupabaseAdminEventRepository implements AdminEventRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listCategories(): Promise<EventCategoryOption[]> {
    const { data, error } = await this.client
      .from("event_categories")
      .select("id, name, slug, color, description, group_name, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Kategoriler alınamadı: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      color: row.color,
      description: row.description ?? null,
      groupName: row.group_name ?? "Genel",
    }));
  }

  async listAll(): Promise<AdminEventRecord[]> {
    const { data, error } = await this.client
      .from("events")
      .select(EVENT_SELECT)
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
        daily_lesson_start: input.dailyLessonStart,
        daily_lesson_end: input.dailyLessonEnd,
        lesson_duration_minutes: input.lessonDurationMinutes,
        total_lesson_count: input.totalLessonCount,
        required_lesson_count: input.requiredLessonCount,
        location_name: input.locationName,
        is_online: input.isOnline,
        ...eventPaymentWriteFields({
          paymentMode: resolvePaymentModeForWrite({
            paymentMode: input.paymentMode,
            isPaid: input.isPaid,
          }),
          priceTryCents: input.priceTryCents,
          displayPriceTryCents: input.displayPriceTryCents,
        }),
        meeting_url: input.meetingUrl,
        max_capacity: input.maxCapacity,
        status: input.status,
        program_code: programCode,
        instructor_id: input.instructorIds[0] ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Etkinlik oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    await replaceEventInstructors(this.client, data.id, input.instructorIds);
    await syncEventSessions(this.client, data.id);

    const { data: created, error: fetchError } = await this.client
      .from("events")
      .select(EVENT_SELECT)
      .eq("id", data.id)
      .single();

    if (fetchError || !created) {
      throw new Error(`Etkinlik oluşturulamadı: ${fetchError?.message ?? "Bilinmeyen hata"}`);
    }

    return mapEvent(created as EventRow);
  }

  async update(input: UpdateEventInput): Promise<AdminEventRecord> {
    const payload: Record<string, string | number | boolean | null> = {};

    if (input.title !== undefined) payload.title = input.title.trim();
    if (input.description !== undefined) payload.description = input.description.trim();
    if (input.eventType !== undefined) payload.event_type = input.eventType;
    if (input.categoryId !== undefined) payload.category_id = input.categoryId;
    if (input.startAt !== undefined) payload.start_at = input.startAt;
    if (input.endAt !== undefined) payload.end_at = input.endAt;
    if (input.dailyLessonStart !== undefined) payload.daily_lesson_start = input.dailyLessonStart;
    if (input.dailyLessonEnd !== undefined) payload.daily_lesson_end = input.dailyLessonEnd;
    if (input.lessonDurationMinutes !== undefined) {
      payload.lesson_duration_minutes = input.lessonDurationMinutes;
    }
    if (input.totalLessonCount !== undefined) {
      payload.total_lesson_count = input.totalLessonCount;
    }
    if (input.requiredLessonCount !== undefined) {
      payload.required_lesson_count = input.requiredLessonCount;
    }
    if (input.locationName !== undefined) payload.location_name = input.locationName;
    if (input.isOnline !== undefined) payload.is_online = input.isOnline;
    if (input.paymentMode !== undefined || input.isPaid !== undefined) {
      Object.assign(
        payload,
        eventPaymentWriteFields({
          paymentMode: resolvePaymentModeForWrite({
            paymentMode: input.paymentMode,
            isPaid: input.isPaid,
          }),
          priceTryCents: input.priceTryCents,
          displayPriceTryCents: input.displayPriceTryCents,
        }),
      );
    } else {
      if (input.priceTryCents !== undefined) payload.price_try_cents = input.priceTryCents;
      if (input.displayPriceTryCents !== undefined) {
        payload.display_price_try_cents = input.displayPriceTryCents;
      }
    }
    if (input.meetingUrl !== undefined) payload.meeting_url = input.meetingUrl;
    if (input.maxCapacity !== undefined) payload.max_capacity = input.maxCapacity;
    if (input.status !== undefined) payload.status = input.status;
    if (input.programCode !== undefined) {
      payload.program_code =
        input.programCode === null ? null : normalizeProgramCode(input.programCode);
    }

    if (Object.keys(payload).length > 0) {
      const { error } = await this.client.from("events").update(payload).eq("id", input.id);

      if (error) {
        throw new Error(`Etkinlik güncellenemedi: ${error.message}`);
      }
    }

    if (input.instructorIds !== undefined) {
      await replaceEventInstructors(this.client, input.id, input.instructorIds);
    }

    const scheduleTouched =
      input.startAt !== undefined ||
      input.endAt !== undefined ||
      input.dailyLessonStart !== undefined ||
      input.dailyLessonEnd !== undefined ||
      input.lessonDurationMinutes !== undefined;

    if (scheduleTouched) {
      await syncEventSessions(this.client, input.id);
    }

    const { data, error } = await this.client
      .from("events")
      .select(EVENT_SELECT)
      .eq("id", input.id)
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
