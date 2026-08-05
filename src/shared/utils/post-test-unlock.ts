const POST_TEST_UNLOCK_STATUSES = new Set(["attended", "completed"]);

export interface PostTestUnlockInput {
  enrollmentStatus: string;
  hasPresentAttendance?: boolean;
  eventEndAt?: string | null;
}

/** Son test (F03), etkinlik bittiğinde veya katılım işaretlendiğinde açılır. */
export function isPostTestUnlocked(input: PostTestUnlockInput): boolean {
  if (input.hasPresentAttendance) {
    return true;
  }

  if (POST_TEST_UNLOCK_STATUSES.has(input.enrollmentStatus)) {
    return true;
  }

  if (input.eventEndAt) {
    const endAt = new Date(input.eventEndAt);
    if (!Number.isNaN(endAt.getTime()) && endAt.getTime() <= Date.now()) {
      return true;
    }
  }

  return false;
}
