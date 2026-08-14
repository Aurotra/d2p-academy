import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { fetchChildProgress } from "@/infrastructure/repositories/fetch-child-progress";
import {
  fetchParentOnboardingContext,
  shouldShowParentOnboarding,
} from "@/infrastructure/repositories/fetch-parent-onboarding-context";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { calculateProgress, profileProgressOptions } from "@/lib/utils/progress";
import { ParentOnboardingGuide } from "@/presentation/components/dashboard/parent-onboarding-guide";
import {
  ChildrenStudentsClient,
  type ChildStudent,
  type EnrollableEventOption,
} from "@/presentation/components/dashboard/children-students-client";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import {
  buildChildProfileForEnrollPath,
  isChildProfileReadyForEnrollment,
} from "@/shared/utils/event-enrollment";

export default async function DashboardChildrenPage({
  searchParams,
}: {
  searchParams: Promise<{ enroll?: string; eventId?: string }>;
}) {
  const query = await searchParams;
  const pendingEventId = query.eventId?.trim() ?? "";
  const enrollIntent = query.enroll === "1";
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    redirect("/login?redirectTo=/dashboard/children");
  }

  const onboardingContext = await fetchParentOnboardingContext(supabase, auth.user.id);
  const showOnboarding = shouldShowParentOnboarding(onboardingContext);

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, created_at, gender, grade_level, school_name, city_district, experience_data, interests, motivation_data, profile_avatar_url, parent_phone, parent_id",
    )
    .eq("role", "student")
    .eq("parent_id", auth.user.id)
    .not("username", "is", null)
    .order("created_at", { ascending: false });

  const { data: eventRows } = await supabase
    .from("events")
    .select(
      "id, title, slug, event_type, start_at, end_at, location_name, is_online, is_paid, price_try_cents, event_categories ( name, color )",
    )
    .eq("status", "published")
    .gte("end_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(40);

  const upcomingEvents: EnrollableEventOption[] = (eventRows ?? []).map((event) => {
    const category = Array.isArray(event.event_categories)
      ? event.event_categories[0]
      : event.event_categories;

    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      eventType: event.event_type as EnrollableEventOption["eventType"],
      categoryName: category?.name ?? null,
      categoryColor: category?.color ?? null,
      startAt: event.start_at,
      endAt: event.end_at,
      locationName: event.location_name,
      isOnline: Boolean(event.is_online),
      isPaid: Boolean(event.is_paid),
      priceTryCents: event.price_try_cents ?? null,
    };
  });

  const baseStudents = data ?? [];

  const students: ChildStudent[] = await Promise.all(
    baseStudents.map(async (student) => {
      const progress = await fetchChildProgress(student.id);
      const profileProgress = calculateProgress(
        {
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
          parent_phone: student.parent_phone,
        },
        profileProgressOptions(student),
      );

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
            consentsCompleted: Boolean(item.consentsCompleted),
            preTestCompleted: Boolean(item.preTestCompleted),
            postTestCompleted: Boolean(item.postTestCompleted),
            postTestUnlocked: Boolean(item.postTestUnlocked),
            postTestDeadlineAt: item.postTestDeadlineAt ?? null,
            requiresPreTest: item.requiresPreTest !== false,
            requiresSurveys: item.requiresSurveys !== false,
            presentCount: item.presentCount ?? 0,
            requiredLessonCount: item.requiredLessonCount ?? 8,
            totalLessonCount: item.totalLessonCount ?? 12,
            attendanceComplete: Boolean(item.attendanceComplete),
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

  if (enrollIntent && students.length > 0) {
    const readyStudents = students.filter((student) =>
      isChildProfileReadyForEnrollment(student.profileProgress),
    );

    if (readyStudents.length === 0) {
      redirect(
        buildChildProfileForEnrollPath(students[0]!.id, {
          eventId: pendingEventId || undefined,
        }),
      );
    }
  }

  const autoEnrollStudentId =
    enrollIntent && students.length > 0
      ? (students.filter((student) => isChildProfileReadyForEnrollment(student.profileProgress))
          .length === 1
          ? students.find((student) => isChildProfileReadyForEnrollment(student.profileProgress))
              ?.id
          : undefined)
      : undefined;

  return (
    <section className="bg-surface-section px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div
          className={`rounded-[2rem] border border-border-surface ${BRAND_SURFACE_GRADIENT} p-8 text-navy-950 shadow-xl`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-navy-900 transition hover:text-navy-950"
            >
              ← Panele dön
            </Link>
            <Link
              href="/dashboard/children/enrollments"
              className="text-sm font-semibold text-navy-900 transition hover:text-navy-950"
            >
              Çocuk etkinlikleri →
            </Link>
          </div>
          <h1 className="mt-3 text-3xl font-black">Çocuklarım</h1>
          <p className="mt-2 text-sm text-[var(--text-on-surface-soft)]">
            Kullanıcı adlı çocuk hesaplarını yönet, etkinliğe kaydet ve gelişimini takip et. Giriş
            adresi:{" "}
            <Link href="/student-login" className="font-semibold underline">
              Öğrenci girişi
            </Link>
            .
          </p>
        </div>

        {showOnboarding ? (
          <div className="mt-8">
            <ParentOnboardingGuide context={onboardingContext} />
          </div>
        ) : null}

        <div className="mt-8">
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Öğrenciler yüklenirken bir hata oluştu.
            </p>
          ) : (
            <Suspense fallback={<p className="text-sm text-muted">Yükleniyor...</p>}>
              <ChildrenStudentsClient
                initialStudents={students}
                upcomingEvents={upcomingEvents}
                autoEnrollStudentId={autoEnrollStudentId}
              />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  );
}
