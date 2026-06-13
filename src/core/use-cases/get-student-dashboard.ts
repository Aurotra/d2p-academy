import type { StudentDashboardData } from "@/core/domain/student-dashboard";

export interface StudentDashboardRepository {
  getDashboardData(userId: string): Promise<StudentDashboardData>;
}

export async function getStudentDashboard(
  repository: StudentDashboardRepository,
  userId: string,
): Promise<StudentDashboardData> {
  return repository.getDashboardData(userId);
}
