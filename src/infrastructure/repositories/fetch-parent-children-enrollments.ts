import "server-only";

import type { EventType } from "@/core/domain/event";
import type {
  ParentChildEnrollmentItem,
  ParentChildrenEnrollmentsData,
} from "@/core/domain/parent-children-enrollments";
import type { EnrollmentSummary } from "@/core/domain/username-student-progress";
import { fetchChildProgress } from "@/infrastructure/repositories/fetch-child-progress";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

interface ChildRow {
  id: string;
  full_name: string;
  username: string;
}

interface EventCategoryRow {
  name: string;
  color: string;
}

interface EventRow {
  id: string;
  title: string;
  slug: string;
  event_type: EventType;
  start_at: string;
  end_at: string;
  location_name: string | null;
  is_online: boolean;
  event_categories: EventCategoryRow | EventCategoryRow[] | null;
}

interface EnrollmentRow {
  id: string;
  user_id: string;
  status: string;
  registered_at: string;
  events: EventRow | EventRow[] | null;
}

function unwrapOne<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function fetchParentChildrenEnrollments(
  parentUserId: string,
): Promise<ParentChildrenEnrollmentsData> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { childrenCount: 0, enrollments: [] };
  }

  const { data: children, error: childrenError } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("role", "student")
    .eq("parent_id", parentUserId)
    .not("username", "is", null)
    .order("created_at", { ascending: false });

  if (childrenError) {
    throw new Error(`Çocuk hesapları alınamadı: ${childrenError.message}`);
  }

  const childRows = (children ?? []) as ChildRow[];
  if (childRows.length === 0) {
    return { childrenCount: 0, enrollments: [] };
  }

  const childById = new Map(childRows.map((child) => [child.id, child]));
  const childIds = childRows.map((child) => child.id);

  const { data: enrollmentRows, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      user_id,
      status,
      registered_at,
      events (
        id,
        title,
        slug,
        event_type,
        start_at,
        end_at,
        location_name,
        is_online,
        event_categories ( name, color )
      )
    `,
    )
    .in("user_id", childIds)
    .neq("status", "cancelled")
    .order("registered_at", { ascending: false });

  if (enrollmentsError) {
    throw new Error(`Etkinlik kayıtları alınamadı: ${enrollmentsError.message}`);
  }

  const progressByEnrollmentId = new Map<string, EnrollmentSummary>();

  await Promise.all(
    childRows.map(async (child) => {
      const progress = await fetchChildProgress(child.id);
      for (const enrollment of progress?.enrollments ?? []) {
        progressByEnrollmentId.set(enrollment.enrollmentId, enrollment);
      }
    }),
  );

  const enrollments: ParentChildEnrollmentItem[] = [];

  for (const row of (enrollmentRows ?? []) as EnrollmentRow[]) {
    const child = childById.get(row.user_id);
    const event = unwrapOne(row.events);
    if (!child || !event) {
      continue;
    }

    const category = unwrapOne(event.event_categories);
    const progress = progressByEnrollmentId.get(row.id);

    enrollments.push({
      enrollmentId: row.id,
      childId: child.id,
      childName: child.full_name,
      childUsername: child.username,
      eventTitle: event.title,
      eventSlug: event.slug,
      eventType: event.event_type,
      categoryName: category?.name ?? null,
      categoryColor: category?.color ?? null,
      startAt: event.start_at,
      endAt: event.end_at,
      locationName: event.location_name,
      isOnline: Boolean(event.is_online),
      status: row.status,
      registeredAt: row.registered_at,
      intakeCompleted: Boolean(progress?.intakeCompleted),
      consentsCompleted: Boolean(progress?.consentsCompleted),
      preTestCompleted: Boolean(progress?.preTestCompleted),
      postTestCompleted: Boolean(progress?.postTestCompleted),
      postTestUnlocked: Boolean(progress?.postTestUnlocked),
      postTestDeadlineAt: progress?.postTestDeadlineAt ?? null,
      requiresPreTest: progress?.requiresPreTest !== false,
      requiresSurveys: progress?.requiresSurveys !== false,
      presentCount: progress?.presentCount ?? 0,
      requiredLessonCount: progress?.requiredLessonCount ?? 8,
      totalLessonCount: progress?.totalLessonCount ?? 12,
      attendanceComplete: Boolean(progress?.attendanceComplete),
    });
  }

  enrollments.sort(
    (left, right) => new Date(right.startAt).getTime() - new Date(left.startAt).getTime(),
  );

  return {
    childrenCount: childRows.length,
    enrollments,
  };
}
