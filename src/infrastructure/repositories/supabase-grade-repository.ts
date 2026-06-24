import type { GradeRecord, GradeWithDocument } from "@/core/domain/grade";
import type { Profile } from "@/core/domain/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

interface GradeRow {
  id: string;
  student_id: string;
  document_id: string;
  score: number;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

interface GradeWithDocumentRow extends GradeRow {
  documents:
    | {
        title: string;
        file_url: string;
      }
    | {
        title: string;
        file_url: string;
      }[]
    | null;
}

function resolveDocumentJoin(
  documents: GradeWithDocumentRow["documents"],
): { title: string; file_url: string } | null {
  if (!documents) {
    return null;
  }

  return Array.isArray(documents) ? (documents[0] ?? null) : documents;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: Profile["role"];
}

function mapGrade(row: GradeRow): GradeRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    documentId: row.document_id,
    score: row.score,
    feedback: row.feedback,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
  };
}

export class SupabaseGradeRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listStudents(): Promise<Profile[]> {
    const { data, error } = await this.client
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("role", "student")
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(`Öğrenciler alınamadı: ${error.message}`);
    }

    return (data as ProfileRow[]).map(mapProfile);
  }

  async listGradesByDocument(documentId: string): Promise<GradeRecord[]> {
    const { data, error } = await this.client
      .from("grades")
      .select("id, student_id, document_id, score, feedback, created_at, updated_at")
      .eq("document_id", documentId);

    if (error) {
      throw new Error(`Notlar alınamadı: ${error.message}`);
    }

    return (data as GradeRow[]).map(mapGrade);
  }

  async listGradesByStudent(studentId: string): Promise<GradeWithDocument[]> {
    const { data, error } = await this.client
      .from("grades")
      .select(
        "id, student_id, document_id, score, feedback, created_at, updated_at, documents(title, file_url)",
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Not raporu alınamadı: ${error.message}`);
    }

    return (data as GradeWithDocumentRow[]).map((row) => {
      const document = resolveDocumentJoin(row.documents);

      return {
        ...mapGrade(row),
        documentTitle: document?.title ?? "Bilinmeyen Doküman",
        documentFileUrl: document?.file_url ?? "#",
      };
    });
  }

  async studentHasGrades(studentId: string): Promise<boolean> {
    const { count, error } = await this.client
      .from("grades")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId);

    if (error) {
      throw new Error(`Not kontrolü yapılamadı: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  async upsertGrade(input: {
    studentId: string;
    documentId: string;
    score: number;
    feedback: string | null;
  }): Promise<GradeRecord> {
    const { data, error } = await this.client
      .from("grades")
      .upsert(
        {
          student_id: input.studentId,
          document_id: input.documentId,
          score: input.score,
          feedback: input.feedback,
        },
        { onConflict: "student_id,document_id" },
      )
      .select("id, student_id, document_id, score, feedback, created_at, updated_at")
      .single();

    if (error || !data) {
      throw new Error(`Not kaydedilemedi: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    return mapGrade(data as GradeRow);
  }
}
