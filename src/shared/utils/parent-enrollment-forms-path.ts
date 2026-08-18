export function parentEnrollmentFormsPath(studentId: string, enrollmentId: string): string {
  if (studentId && enrollmentId) {
    return `/dashboard/children/${studentId}/enrollments/${enrollmentId}/forms`;
  }

  return "/dashboard/children";
}
