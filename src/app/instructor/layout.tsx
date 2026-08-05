import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { getInstructorAccess } from "@/infrastructure/auth/get-instructor-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { InstructorShell } from "@/presentation/components/instructor/instructor-shell";
import { NO_INDEX_METADATA } from "@/shared/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = NO_INDEX_METADATA;

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login?redirectTo=/instructor");
  }

  const access = await getInstructorAccess(client);

  if (!access.authorized) {
    redirect(access.reason === "unauthenticated" ? "/login?redirectTo=/instructor" : "/dashboard");
  }

  const adminAccess = await getAdminAccess(client);

  return (
    <InstructorShell profile={access.profile} isAdmin={adminAccess.authorized}>
      {children}
    </InstructorShell>
  );
}
