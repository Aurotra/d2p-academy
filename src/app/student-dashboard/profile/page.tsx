import Link from "next/link";
import { redirect } from "next/navigation";

import { getStudentSession } from "@/infrastructure/auth/get-student-session";
import { UsernameStudentProfileForm } from "@/presentation/components/student-dashboard/username-student-profile-form";

export const dynamic = "force-dynamic";

export default async function StudentDashboardProfilePage() {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/student-dashboard"
          className="inline-flex text-sm font-semibold text-document-primary hover:underline"
        >
          ← Panele dön
        </Link>
        <UsernameStudentProfileForm />
      </div>
    </section>
  );
}
