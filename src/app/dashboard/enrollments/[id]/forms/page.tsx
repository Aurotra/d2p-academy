import Link from "next/link";

import { CourseApplicationWizard } from "@/presentation/components/forms/course-application-wizard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EnrollmentFormsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex text-sm font-semibold text-document-primary hover:underline"
        >
          ← Öğrenci paneline dön
        </Link>
        <CourseApplicationWizard enrollmentId={id} />
      </div>
    </section>
  );
}
