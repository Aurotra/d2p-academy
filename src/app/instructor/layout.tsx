import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getInstructorAccess } from "@/infrastructure/auth/get-instructor-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { InstructorShell } from "@/presentation/components/instructor/instructor-shell";

export const dynamic = "force-dynamic";

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/instructor-login?redirectTo=/instructor");
  }

  const access = await getInstructorAccess(client);

  if (!access.authorized) {
    redirect(access.reason === "unauthenticated" ? "/instructor-login?redirectTo=/instructor" : "/dashboard");
  }

  return <InstructorShell profile={access.profile}>{children}</InstructorShell>;
}
