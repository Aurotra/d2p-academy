export interface PostTestUnlockInput {
  postTestUnlockedAt?: string | null;
  postTestDeadlineAt?: string | null;
}

/** Son test (F03), zorunlu ders yoklaması tamamlanınca açılır; süre dolunca kapanır. */
export function isPostTestUnlocked(input: PostTestUnlockInput): boolean {
  if (!input.postTestUnlockedAt) {
    return false;
  }

  if (input.postTestDeadlineAt) {
    const deadline = new Date(input.postTestDeadlineAt);
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) {
      return false;
    }
  }

  return true;
}

export function formatPostTestDeadlineLabel(deadlineAt: string | null | undefined): string | null {
  if (!deadlineAt) {
    return null;
  }

  const deadline = new Date(deadlineAt);
  if (Number.isNaN(deadline.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(deadline);
}
