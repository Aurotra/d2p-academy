export function parseAdminNotificationEmails(raw: string | undefined | null): string[] {
  const unique = new Set<string>();
  for (const part of (raw ?? "").split(/[,;\s]+/)) {
    const email = part.trim().toLowerCase();
    if (email.includes("@") && email.includes(".")) {
      unique.add(email);
    }
  }
  return [...unique];
}

export function shouldNotifyAdminOfEnrollment(input: {
  alreadyEnrolled?: boolean;
  alreadyPaid?: boolean;
  enrollmentSource?: string | null;
  status?: string | null;
}): boolean {
  if (input.alreadyEnrolled || input.alreadyPaid) {
    return false;
  }
  if (input.status === "pending_payment") {
    return false;
  }
  if (input.enrollmentSource === "admin_manual") {
    return false;
  }
  return true;
}
