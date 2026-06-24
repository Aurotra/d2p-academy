"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { Profile } from "@/core/domain/auth";
import type { GradeRecord } from "@/core/domain/grade";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { SupabaseGradeRepository } from "@/infrastructure/repositories/supabase-grade-repository";
import { Button } from "@/presentation/components/ui/button";
import { Textarea } from "@/presentation/components/ui/textarea";

type AlertState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

interface StudentGradeFormState {
  score: string;
  feedback: string;
}

function buildInitialFormState(
  students: Profile[],
  grades: GradeRecord[],
): Record<string, StudentGradeFormState> {
  const gradeByStudent = new Map(grades.map((grade) => [grade.studentId, grade]));

  return Object.fromEntries(
    students.map((student) => {
      const existing = gradeByStudent.get(student.id);
      return [
        student.id,
        {
          score: existing ? String(existing.score) : "",
          feedback: existing?.feedback ?? "",
        },
      ];
    }),
  );
}

export default function AdminEvaluateDocumentPage() {
  const router = useRouter();
  const params = useParams<{ document_id: string }>();
  const documentId = params.document_id;

  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [documentTitle, setDocumentTitle] = useState("");
  const [students, setStudents] = useState<Profile[]>([]);
  const [formState, setFormState] = useState<Record<string, StudentGradeFormState>>({});
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);

  const loadPageData = useCallback(async () => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      router.replace("/login");
      return;
    }

    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      router.replace("/login");
      return;
    }

    setIsAuthorizing(false);

    const { data: document, error: documentError } = await client
      .from("documents")
      .select("title")
      .eq("id", documentId)
      .single();

    if (documentError || !document) {
      setAlert({ type: "error", message: "Doküman bulunamadı." });
      setIsLoading(false);
      return;
    }

    const repository = new SupabaseGradeRepository(client);
    const [studentList, gradeList] = await Promise.all([
      repository.listStudents(),
      repository.listGradesByDocument(documentId),
    ]);

    setDocumentTitle(document.title);
    setStudents(studentList);
    setFormState(buildInitialFormState(studentList, gradeList));
    setIsLoading(false);
  }, [documentId, router]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  function updateStudentField(
    studentId: string,
    field: keyof StudentGradeFormState,
    value: string,
  ) {
    setFormState((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        [field]: value,
      },
    }));
  }

  async function handleSaveStudent(studentId: string) {
    setAlert(null);

    const entry = formState[studentId];
    const score = Number(entry.score);

    if (!Number.isInteger(score) || score < 0 || score > 100) {
      setAlert({
        type: "error",
        message: "Puan 0 ile 100 arasında tam sayı olmalıdır.",
      });
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setAlert({ type: "error", message: "Supabase bağlantısı kurulamadı." });
      return;
    }

    setSavingStudentId(studentId);

    try {
      const repository = new SupabaseGradeRepository(client);
      await repository.upsertGrade({
        studentId,
        documentId,
        score,
        feedback: entry.feedback.trim() || null,
      });

      setAlert({ type: "success", message: "Not başarıyla kaydedildi." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Not kaydedilemedi.";
      setAlert({ type: "error", message });
    } finally {
      setSavingStudentId(null);
    }
  }

  if (isAuthorizing || isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        {isAuthorizing ? "Yetki kontrol ediliyor..." : "Öğrenci listesi yükleniyor..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/admin/documents"
          className="text-sm font-semibold text-document-primary transition hover:text-document-primary-hover"
        >
          ← Dökümanlara Dön
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Ödev Değerlendirme
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{documentTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Her öğrenci için puan ve geri bildirim girin. Kayıtlar otomatik olarak güncellenir.
        </p>
      </div>

      {alert ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            alert.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
          role="alert"
        >
          {alert.message}
        </div>
      ) : null}

      {students.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-lg font-semibold text-slate-800">Kayıtlı öğrenci bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student) => {
            const entry = formState[student.id] ?? { score: "", feedback: "" };
            const isSaving = savingStudentId === student.id;

            return (
              <article
                key={student.id}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">{student.fullName}</h2>
                  <p className="text-sm text-slate-500">{student.email}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                  <div>
                    <label
                      htmlFor={`score-${student.id}`}
                      className="mb-2 block text-sm font-medium text-slate-900"
                    >
                      Puan (0-100)
                    </label>
                    <input
                      id={`score-${student.id}`}
                      type="number"
                      min={0}
                      max={100}
                      value={entry.score}
                      disabled={isSaving}
                      onChange={(event) =>
                        updateStudentField(student.id, "score", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-document-primary focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <Textarea
                    id={`feedback-${student.id}`}
                    label="Geri Bildirim"
                    value={entry.feedback}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateStudentField(student.id, "feedback", event.target.value)
                    }
                    placeholder="Öğrenciye kısa değerlendirme notu yazın..."
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleSaveStudent(student.id)}
                    className="bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document"
                  >
                    {isSaving ? "Kaydediliyor..." : "Notu Kaydet"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
