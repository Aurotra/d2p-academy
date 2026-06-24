"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { Profile } from "@/core/domain/auth";
import type { GradeRecord } from "@/core/domain/grade";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { SupabaseGradeRepository } from "@/infrastructure/repositories/supabase-grade-repository";
import { Button } from "@/presentation/components/ui/button";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";

type AlertState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

export default function AdminEvaluateDocumentPage() {
  const router = useRouter();
  const params = useParams<{ document_id: string }>();
  const documentId = params.document_id;

  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [students, setStudents] = useState<Profile[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
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
    setGrades(gradeList);
    setIsLoading(false);
  }, [documentId, router]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (!selectedStudentId) {
      setScore("");
      setFeedback("");
      return;
    }

    const existing = grades.find((grade) => grade.studentId === selectedStudentId);
    setScore(existing ? String(existing.score) : "");
    setFeedback(existing?.feedback ?? "");
  }, [selectedStudentId, grades]);

  async function handleSubmit() {
    setAlert(null);

    if (!selectedStudentId) {
      setAlert({ type: "error", message: "Lütfen bir öğrenci seçin." });
      return;
    }

    const numericScore = Number(score);
    if (!Number.isInteger(numericScore) || numericScore < 0 || numericScore > 100) {
      setAlert({ type: "error", message: "Puan 0 ile 100 arasında tam sayı olmalıdır." });
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setAlert({ type: "error", message: "Supabase bağlantısı kurulamadı." });
      return;
    }

    setIsSaving(true);

    try {
      const repository = new SupabaseGradeRepository(client);
      const saved = await repository.upsertGrade({
        studentId: selectedStudentId,
        documentId,
        score: numericScore,
        feedback: feedback.trim() || null,
      });

      setGrades((current) => {
        const others = current.filter((grade) => grade.studentId !== selectedStudentId);
        return [...others, saved];
      });

      setAlert({ type: "success", message: "Not başarıyla kaydedildi." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Not kaydedilemedi.";
      setAlert({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  }

  if (isAuthorizing || isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        {isAuthorizing ? "Yetki kontrol ediliyor..." : "Veriler yükleniyor..."}
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
          Öğrenci seçin, puan ve gelişim yorumunu kaydedin.
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

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        {students.length === 0 ? (
          <p className="text-center text-slate-500">Kayıtlı öğrenci bulunamadı.</p>
        ) : (
          <div className="space-y-5">
            <Select
              label="Öğrenci"
              value={selectedStudentId}
              disabled={isSaving}
              onChange={(event) => setSelectedStudentId(event.target.value)}
            >
              <option value="">Öğrenci seçin</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} ({student.email})
                </option>
              ))}
            </Select>

            <div className="grid gap-4 md:grid-cols-[140px_1fr]">
              <div>
                <label htmlFor="score" className="mb-2 block text-sm font-medium text-slate-900">
                  Puan (0-100)
                </label>
                <input
                  id="score"
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  disabled={isSaving || !selectedStudentId}
                  onChange={(event) => setScore(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-document-primary focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <Textarea
                label="Gelişim Yorumu"
                value={feedback}
                disabled={isSaving || !selectedStudentId}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Öğrencinin gelişimine dair geri bildirim yazın..."
              />
            </div>

            <Button
              type="button"
              disabled={isSaving || !selectedStudentId}
              onClick={() => void handleSubmit()}
              className="bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document"
            >
              {isSaving ? "Kaydediliyor..." : "Notu Kaydet"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
