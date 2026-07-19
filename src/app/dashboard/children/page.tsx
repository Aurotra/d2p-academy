import Link from "next/link";
import { redirect } from "next/navigation";

import { fetchChildProgress } from "@/infrastructure/repositories/fetch-child-progress";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import {
  ChildrenStudentsClient,
  type ChildStudent,
} from "@/presentation/components/dashboard/children-students-client";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";

export default async function DashboardChildrenPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    redirect("/login?redirectTo=/dashboard/children");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, created_at")
    .eq("role", "student")
    .eq("parent_id", auth.user.id)
    .not("username", "is", null)
    .order("created_at", { ascending: false });

  const baseStudents = (data ?? []) as ChildStudent[];

  const students: ChildStudent[] = await Promise.all(
    baseStudents.map(async (student) => {
      const progress = await fetchChildProgress(student.id);
      return {
        ...student,
        enrollmentCount: progress?.enrollments?.length ?? 0,
        certificateCount: progress?.certificates?.length ?? 0,
      };
    }),
  );

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div
          className={`rounded-[2rem] border border-sky-200 ${BRAND_SURFACE_GRADIENT} p-8 text-sky-950 shadow-xl`}
        >
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-sky-800 transition hover:text-sky-950"
          >
            ← Panele dön
          </Link>
          <h1 className="mt-3 text-3xl font-black">Çocuklarım</h1>
          <p className="mt-2 text-sm text-sky-900/80">
            Çocukların için kullanıcı adı ve şifre oluştur. Onlar{" "}
            <Link href="/student-login" className="font-semibold underline">
              /student-login
            </Link>{" "}
            üzerinden giriş yapar.
          </p>
        </div>

        <div className="mt-8">
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Öğrenciler yüklenirken bir hata oluştu.
            </p>
          ) : (
            <ChildrenStudentsClient initialStudents={students} />
          )}
        </div>
      </div>
    </section>
  );
}
