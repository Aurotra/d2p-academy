import type {
  AdminEventRecord,
  CreateEventInput,
  EventCategoryOption,
  UpdateEventInput,
} from "@/core/domain/admin-event";

export interface AdminEventRepository {
  listCategories(): Promise<EventCategoryOption[]>;
  listAll(): Promise<AdminEventRecord[]>;
  create(input: CreateEventInput): Promise<AdminEventRecord>;
  update(input: UpdateEventInput): Promise<AdminEventRecord>;
  delete(id: string): Promise<void>;
}

export async function listAdminEvents(
  repository: AdminEventRepository,
): Promise<AdminEventRecord[]> {
  return repository.listAll();
}

export async function listEventCategories(
  repository: AdminEventRepository,
): Promise<EventCategoryOption[]> {
  return repository.listCategories();
}

export async function createAdminEvent(
  repository: AdminEventRepository,
  input: CreateEventInput,
): Promise<AdminEventRecord> {
  return repository.create(input);
}

export async function updateAdminEvent(
  repository: AdminEventRepository,
  input: UpdateEventInput,
): Promise<AdminEventRecord> {
  return repository.update(input);
}

export async function deleteAdminEvent(repository: AdminEventRepository, id: string): Promise<void> {
  return repository.delete(id);
}
