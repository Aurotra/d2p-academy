import type { DocumentRecord } from "@/core/domain/document";
import type { SupabaseClient } from "@supabase/supabase-js";

interface DocumentRow {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
}

function mapDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    title: row.title,
    fileUrl: row.file_url,
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseDocumentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listDocuments(): Promise<DocumentRecord[]> {
    const { data, error } = await this.client
      .from("documents")
      .select("id, title, file_url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Dokümanlar alınamadı: ${error.message}`);
    }

    return (data as DocumentRow[]).map(mapDocument);
  }

  async createDocument(title: string, fileUrl: string): Promise<DocumentRecord> {
    const { data, error } = await this.client
      .from("documents")
      .insert({ title, file_url: fileUrl })
      .select("id, title, file_url, created_at")
      .single();

    if (error || !data) {
      throw new Error(`Doküman kaydedilemedi: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    return mapDocument(data as DocumentRow);
  }
}
