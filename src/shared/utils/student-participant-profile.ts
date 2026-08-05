/** Etkinliğe kayıt olabilecek öğrenci profili (kullanıcı adlı çocuk hesabı). */
export function isStudentParticipantProfile(profile: {
  role?: string | null;
  username?: string | null;
}): boolean {
  return profile.role === "student" && Boolean(profile.username?.trim());
}
