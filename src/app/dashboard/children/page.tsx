import Link from "next/link";
import { redirect } from "next/navigation";

import { fetchChildProgress } from "@/infrastructure/repositories/fetch-child-progress";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { calculateProgress } from "@/lib/utils/progress";
import {
  ChildrenStudentsClient,
  type ChildStudent,
  type EnrollableEventOption,
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
    .select(
      "id, full_name, username, created_at, gender, grade_level, school_name, city_district, experience_data, interests, motivation_data, profile_avatar_url",
    )
    .eq("role", "student")
    .eq("parent_id", auth.user.id)
    .not("username", "is", null)
    .order("created_at", { ascending: false });

  const { data: eventRows } = await supabase
    .from("events")
    .select("id, title, start_at, end_at")
    .eq("status", "published")
    .gte("end_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(40);

  const upcomingEvents: EnrollableEventOption[] = (eventRows ?? []).map((event) => ({
    id: event.id,
    title: event.title,
    startAt: event.start_at,
  }));

  const baseStudents = data ?? [];

  const students: ChildStudent[] = await Promise.all(
    baseStudents.map(async (student) => {
      const progress = await fetchChildProgress(student.id);
      const profileProgress = calculateProgress({
        full_name: student.full_name,
        gender: student.gender,
        grade_level: student.grade_level,
        school_name: student.school_name,
        city_district: student.city_district,
        experience_data: student.experience_data as {
          coding_experience?: string;
        } | null,
        interests: student.interests,
        motivation_data: student.motivation_data as {
          hedef?: string;
          beklenti?: number;
        } | null,
        profile_avatar_url: student.profile_avatar_url,
      });

      return {
        id: student.id,
        full_name: student.full_name,
        username: student.username,
        created_at: student.created_at,
        profileProgress,
        enrollmentCount: progress?.enrollments?.length ?? 0,
        certificateCount: progress?.certificates?.length ?? 0,
        progressPreview: {
          enrollments: (progress?.enrollments ?? []).map((item) => ({
            enrollmentId: item.enrollmentId,
            title: item.eventTitle,
            status: item.status,
            date: item.eventDate,
            intakeCompleted: Boolean(item.intakeCompleted),
            preTestCompleted: Boolean(item.preTestCompleted),
            postTestCompleted: Boolean(item.postTestCompleted),
          })),
          certificates: (progress?.certificates ?? []).map((item) => ({
            code: item.certificateCode,
            issuedAt: item.issuedAt,
            pdfUrl: item.pdfUrl ?? null,
          })),
          grades: (progress?.grades ?? []).map((item) => ({
            documentTitle: item.documentTitle,
            score: item.score,
            feedback: item.feedback,
            createdAt: item.createdAt,
            documentFileUrl: item.documentFileUrl,
          })),
          badges: (progress?.badges ?? []).map((item) => ({
            name: item.name,
            awardedAt: item.awardedAt,
          })),
          printOrders: (progress?.activePrintOrders ?? []).map((item) => ({
            itemName: item.itemName,
            status: item.status,
            requestedAt: item.requestedAt,
          })),
        },
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
            Kullanıcı adlı çocuk hesaplarını yönet, etkinliğe kaydet ve gelişimini takip et. Giriş
            adresi:{" "}
            <Link href="/student-login" className="font-semibold underline">
              Öğrenci girişi
            </Link>
            .
          </p>
        </div>

        <div className="mt-8">
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Öğrenciler yüklenirken bir hata oluştu.
            </p>
          ) : (
            <ChildrenStudentsClient
              initialStudents={students}
              upcomingEvents={upcomingEvents}
            />
          )}
        </div>
      </div>
    </section>
  );
}
