import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { UsernameStudentProfileForm } from "@/presentation/components/student-dashboard/username-student-profile-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ childId: string }>;
}

export default async function ParentChildProfilePage({ params }: PageProps) {
  const { childId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    redirect(`/login?redirectTo=/dashboard/children/${childId}/profile`);
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

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/dashboard/children"
          className="inline-flex text-sm font-semibold text-document-primary hover:underline"
        >
          ← Çocuk hesaplarına dön
        </Link>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-950">
          <p className="font-semibold">
            {child.full_name}
            {child.username ? ` (@${child.username})` : ""} profilini düzenliyorsunuz.
          </p>
          <p className="mt-1 text-sky-900/80">
            Sertifika verebilmek için profilin %100 dolu olması gerekir.
          </p>
        </div>

        <UsernameStudentProfileForm
          apiPath={`/api/v1/parent/students/${childId}/profile`}
          title="Çocuk profili"
          backHref="/dashboard/children"
          backLabel="Çocuk hesaplarına dön"
        />
      </div>
    </section>
  );
}
