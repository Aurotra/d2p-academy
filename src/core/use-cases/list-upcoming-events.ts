import type { AcademyEvent } from "@/core/domain/event";

export interface EventRepository {
  listUpcoming(limit: number): Promise<AcademyEvent[]>;
}

export async function listUpcomingEvents(
  repository: EventRepository,
  limit = 6,
): Promise<AcademyEvent[]> {
  return repository.listUpcoming(limit);
}
