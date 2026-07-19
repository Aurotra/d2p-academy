/** Prefer email; fall back to @username for username-auth students. */
export function formatStudentContact(
  email: string | null | undefined,
  username: string | null | undefined,
): string {
  const trimmedEmail = email?.trim();
  if (trimmedEmail) {
    return trimmedEmail;
  }
  const trimmedUsername = username?.trim();
  if (trimmedUsername) {
    return `@${trimmedUsername}`;
  }
  return "—";
}
