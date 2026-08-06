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

        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="text-base font-bold text-amber-900">
            Profil %100 tamamlanmadan kayıt yapılamaz
          </p>
          <p className="mt-2 leading-relaxed text-amber-950/90">
            Kurslara kayıt olabilmek ve sertifika alabilmek için aşağıdaki tüm zorunlu alanları
            doldurun. Tamamlanan proje sayısı isteğe bağlıdır.
          </p>
          <p className="mt-2 font-semibold text-amber-900">
            {child.full_name}
            {child.username ? ` (@${child.username})` : ""}
          </p>
        </div>

        <UsernameStudentProfileForm
          apiPath={`/api/v1/parent/students/${childId}/profile`}
          title="Çocuk profili"
          backHref="/dashboard/children"
          backLabel="Çocuk hesaplarına dön"
          redirectOnCompleteHref="/etkinlikler"
          requireCompleteToSave
        />
      </div>
    </section>
  );
}
