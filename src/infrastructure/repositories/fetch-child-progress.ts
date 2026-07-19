import "server-only";

import type { ChildProgress } from "@/core/domain/username-student-progress";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function fetchChildProgress(childId: string): Promise<ChildProgress | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("get_child_progress", {
    p_child_id: childId,
  });

  if (error) {
    console.error("[fetchChildProgress]", error.message);
    return null;
  }

  return (data as ChildProgress) ?? null;
}
