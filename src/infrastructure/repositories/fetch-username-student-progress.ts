import "server-only";

import type { StudentProgress } from "@/core/domain/username-student-progress";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export async function fetchUsernameStudentProgress(studentId: string): Promise<StudentProgress> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc("get_student_progress", {
    p_student_id: studentId,
  });

  if (error) {
    console.error("[fetchUsernameStudentProgress]", error.message);
    throw new Error("Öğrenci verisi alınamadı.");
  }

  return (data as StudentProgress) ?? { enrollments: [], certificates: [], badges: [] };
}
