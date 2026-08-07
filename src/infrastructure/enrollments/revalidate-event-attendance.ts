import { revalidatePath } from "next/cache";

export function revalidateEventAttendancePaths(eventIds: string[]): void {
  for (const eventId of eventIds) {
    if (!eventId) {
      continue;
    }

    revalidatePath(`/admin/events/${eventId}/attendance`);
    revalidatePath(`/instructor/events/${eventId}/attendance`);
  }
}
