export interface InstructorCapableProfile {
  role: string;
  is_instructor?: boolean | null;
}

export function profileHasInstructorCapability(profile: InstructorCapableProfile): boolean {
  return profile.is_instructor === true || profile.role === "instructor";
}

export function isInstructorOnlyAccount(profile: InstructorCapableProfile): boolean {
  return (
    profileHasInstructorCapability(profile) &&
    profile.role !== "parent" &&
    profile.role !== "student" &&
    profile.role !== "admin"
  );
}
