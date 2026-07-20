import Link from "next/link";
import { redirect } from "next/navigation";

import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { CourseApplicationWizard } from "@/presentation/components/forms/course-application-wizard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ childId: string; id: string }>;
}

export default async function ParentChildEnrollmentFormsPage({ params }: PageProps) {
  const { childId, id: enrollmentId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    redirect(
      `/login?redirectTo=/dashboard/children/${childId}/enrollments/${enrollmentId}/forms`,
    );
  }

  const { data: child } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("id", childId)
    .eq("parent_id", auth.user.id)
    .eq("role", "student")
    .not("username", "is", null)
    .maybeSingle();

  if (!child) {
    redirect("/dashboard/children");
  }

  let eventTitle: string | null = null;
  try {
    const service = createServiceRoleClient();
    const { data: enrollment } = await service
      .from("enrollments")
      .select("id, user_id, events(title)")
      .eq("id", enrollmentId)
      .eq("user_id", childId)
      .maybeSingle();

    if (!enrollment) {
      redirect("/dashboard/children");
    }

    const eventTitleRaw = enrollment.events as
      | { title?: string }
      | { title?: string }[]
      | null;
    eventTitle = Array.isArray(eventTitleRaw)
      ? (eventTitleRaw[0]?.title ?? null)
      : (eventTitleRaw?.title ?? null);
  } catch {
    redirect("/dashboard/children");
  }

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/dashboard/children"
          className="inline-flex text-sm font-semibold text-document-primary hover:underline"
        >
          ← Çocuk hesaplarına dön
        </Link>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-950">
          <p className="font-semibold">
            {child.full_name}
            {child.username ? ` (@${child.username})` : ""} adına form dolduruyorsunuz
            {eventTitle ? ` — ${eventTitle}` : ""}.
          </p>
          <p className="mt-1 text-sky-900/80">
            Onay adımında veli / yasal temsilci imzasını kendi adınızla atın. Çocuğun profilini
            tamamlaması gerekiyorsa öğrenci girişi ile profil sayfasını kullanın.
          </p>
        </div>

        <CourseApplicationWizard
          enrollmentId={enrollmentId}
          profileHref="/dashboard/children"
        />
      </div>
    </section>
  );
}
