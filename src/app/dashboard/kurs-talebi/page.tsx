import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { CourseDemandClient } from "@/presentation/components/dashboard/course-demand-client";

export const dynamic = "force-dynamic";

export default async function CourseDemandPage() {
  const client = await createSupabaseServerClient();
  if (!client) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/kurs-talebi");
  }

  return <CourseDemandClient />;
}
