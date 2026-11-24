import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreatePresentationInput,
  InstructorPresentationCard,
  Presentation,
  PresentationAssignment,
  PresentationWithAssignments,
  UpdatePresentationInput,
} from "@/core/domain/presentation";

const SIGNED_URL_SECONDS = 60 * 60; // 1 hour

interface PresentationRow {
  id: string;
  title: string;
  description: string;
  category: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  byte_size: number;
  page_count: number;
  is_published: boolean;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AssignmentRow {
  id: string;
  presentation_id: string;
  instructor_id: string;
  assigned_by: string | null;
  created_at: string;
  profiles?:
    | { full_name: string | null; email: string | null }
    | { full_name: string | null; email: string | null }[]
    | null;
}

function mapPresentation(row: PresentationRow): Presentation {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? "",
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size) || 0,
    pageCount: Number(row.page_count) || 0,
    isPublished: Boolean(row.is_published),
    createdBy: row.created_by,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function unwrapProfile(
  value: AssignmentRow["profiles"],
): { full_name: string | null; email: string | null } | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapAssignment(row: AssignmentRow): PresentationAssignment {
  const profile = unwrapProfile(row.profiles);
  return {
    id: row.id,
    presentationId: row.presentation_id,
    instructorId: row.instructor_id,
    assignedBy: row.assigned_by,
    createdAt: row.created_at,
    instructorName: profile?.full_name ?? null,
    instructorEmail: profile?.email ?? null,
  };
}

export class SupabasePresentationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listAllForAdmin(): Promise<PresentationWithAssignments[]> {
    const { data, error } = await this.client
      .from("presentations")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(`Sunumlar alınamadı: ${error.message}`);
    }

    const presentations = (data as PresentationRow[]).map(mapPresentation);
    if (presentations.length === 0) {
      return [];
    }

    const ids = presentations.map((item) => item.id);
    const { data: assignmentRows, error: assignmentError } = await this.client
      .from("presentation_assignments")
      .select(
        `
        id,
        presentation_id,
        instructor_id,
        assigned_by,
        created_at,
        profiles:instructor_id ( full_name, email )
      `,
      )
      .in("presentation_id", ids);

    if (assignmentError) {
      throw new Error(`Sunum atamaları alınamadı: ${assignmentError.message}`);
    }

    const byPresentation = new Map<string, PresentationAssignment[]>();
    for (const row of (assignmentRows ?? []) as AssignmentRow[]) {
      const mapped = mapAssignment(row);
      const list = byPresentation.get(mapped.presentationId) ?? [];
      list.push(mapped);
      byPresentation.set(mapped.presentationId, list);
    }

    return presentations.map((presentation) => {
      const assignments = byPresentation.get(presentation.id) ?? [];
      return {
        ...presentation,
        assignments,
        instructorIds: assignments.map((item) => item.instructorId),
      };
    });
  }

  async listForInstructor(instructorId: string): Promise<InstructorPresentationCard[]> {
    const { data: assignments, error: assignmentError } = await this.client
      .from("presentation_assignments")
      .select("presentation_id")
      .eq("instructor_id", instructorId);

    if (assignmentError) {
      throw new Error(`Sunum atamaları alınamadı: ${assignmentError.message}`);
    }

    const ids = [...new Set((assignments ?? []).map((row) => row.presentation_id as string))];
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from("presentations")
      .select("id, title, description, category, page_count, updated_at, file_name")
      .in("id", ids)
      .is("deleted_at", null)
      .eq("is_published", true)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(`Sunumlar alınamadı: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string) ?? "",
      category: (row.category as string) ?? "",
      pageCount: Number(row.page_count) || 0,
      updatedAt: row.updated_at as string,
      fileName: row.file_name as string,
    }));
  }

  async getById(id: string): Promise<Presentation | null> {
    const { data, error } = await this.client
      .from("presentations")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Sunum alınamadı: ${error.message}`);
    }
    return data ? mapPresentation(data as PresentationRow) : null;
  }

  async instructorHasAccess(presentationId: string, instructorId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("presentation_assignments")
      .select("id")
      .eq("presentation_id", presentationId)
      .eq("instructor_id", instructorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Erişim kontrolü başarısız: ${error.message}`);
    }
    return Boolean(data?.id);
  }

  async create(input: CreatePresentationInput): Promise<Presentation> {
    const { data, error } = await this.client
      .from("presentations")
      .insert({
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        category: input.category?.trim() ?? "",
        storage_path: input.storagePath,
        file_name: input.fileName,
        mime_type: input.mimeType,
        byte_size: input.byteSize,
        page_count: input.pageCount ?? 0,
        is_published: input.isPublished ?? true,
        created_by: input.createdBy ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Sunum oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    const presentation = mapPresentation(data as PresentationRow);
    if (input.instructorIds?.length) {
      await this.replaceAssignments(
        presentation.id,
        input.instructorIds,
        input.createdBy ?? null,
      );
    }
    return presentation;
  }

  async update(id: string, input: UpdatePresentationInput): Promise<Presentation> {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.description !== undefined) patch.description = input.description.trim();
    if (input.category !== undefined) patch.category = input.category.trim();
    if (input.pageCount !== undefined) patch.page_count = input.pageCount;
    if (input.isPublished !== undefined) patch.is_published = input.isPublished;
    if (input.storagePath !== undefined) patch.storage_path = input.storagePath;
    if (input.fileName !== undefined) patch.file_name = input.fileName;
    if (input.mimeType !== undefined) patch.mime_type = input.mimeType;
    if (input.byteSize !== undefined) patch.byte_size = input.byteSize;

    const { data, error } = await this.client
      .from("presentations")
      .update(patch)
      .eq("id", id)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Sunum güncellenemedi: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    if (input.instructorIds !== undefined) {
      await this.replaceAssignments(id, input.instructorIds, null);
    }

    return mapPresentation(data as PresentationRow);
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.client
      .from("presentations")
      .update({
        deleted_at: new Date().toISOString(),
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Sunum silinemedi: ${error.message}`);
    }
  }

  async replaceAssignments(
    presentationId: string,
    instructorIds: string[],
    assignedBy: string | null,
  ): Promise<void> {
    const uniqueIds = [...new Set(instructorIds.map((id) => id.trim()).filter(Boolean))];

    const { error: deleteError } = await this.client
      .from("presentation_assignments")
      .delete()
      .eq("presentation_id", presentationId);

    if (deleteError) {
      throw new Error(`Atamalar temizlenemedi: ${deleteError.message}`);
    }

    if (uniqueIds.length === 0) {
      return;
    }

    const { error: insertError } = await this.client.from("presentation_assignments").insert(
      uniqueIds.map((instructorId) => ({
        presentation_id: presentationId,
        instructor_id: instructorId,
        assigned_by: assignedBy,
      })),
    );

    if (insertError) {
      throw new Error(`Atamalar kaydedilemedi: ${insertError.message}`);
    }
  }

  async createSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from("presentations")
      .createSignedUrl(storagePath, SIGNED_URL_SECONDS);

    if (error || !data?.signedUrl) {
      throw new Error(`İmzalı URL oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
    }
    return data.signedUrl;
  }
}
