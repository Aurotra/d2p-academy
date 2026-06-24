"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import type { DocumentRecord } from "@/core/domain/document";
import { SupabaseDocumentRepository } from "@/infrastructure/repositories/supabase-document-repository";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

type AlertState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function AdminDocumentsPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [alert, setAlert] = useState<AlertState>(null);

  const loadDocuments = useCallback(async () => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      return;
    }

    const repository = new SupabaseDocumentRepository(client);
    const items = await repository.listDocuments();
    setDocuments(items);
    setIsLoadingDocuments(false);
  }, []);

  useEffect(() => {
    async function verifyAdminAccess() {
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
      void loadDocuments();
    }

    void verifyAdminAccess();
  }, [router, loadDocuments]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlert(null);

    const client = createSupabaseBrowserClient();
    if (!client) {
      setAlert({ type: "error", message: "Supabase bağlantısı kurulamadı." });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const file = formData.get("file");

    if (!title) {
      setAlert({ type: "error", message: "Doküman başlığı zorunludur." });
      return;
    }

    if (!(file instanceof File) || file.size === 0) {
      setAlert({ type: "error", message: "Lütfen yüklenecek bir dosya seçin." });
      return;
    }

    setIsUploading(true);

    try {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const storagePath = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;

      const { error: uploadError } = await client.storage
        .from("documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = client.storage.from("documents").getPublicUrl(storagePath);

      const repository = new SupabaseDocumentRepository(client);
      await repository.createDocument(title, publicUrl);

      formRef.current?.reset();
      setAlert({ type: "success", message: "Doküman başarıyla yüklendi." });
      await loadDocuments();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Doküman yüklenemedi.";
      setAlert({ type: "error", message });
    } finally {
      setIsUploading(false);
    }
  }

  if (isAuthorizing) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Yetki kontrol ediliyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Doküman Yönetimi
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Döküman / Ödev Yükle</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          PDF veya ders materyallerini yükleyin. Öğrenciler panelinden bu dosyalara erişebilir.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        {alert ? (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-medium ${
              alert.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
            role="alert"
          >
            {alert.message}
          </div>
        ) : null}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <Input
            name="title"
            label="Doküman Başlığı"
            placeholder="Örn: 3D Tasarım Ödevi - Hafta 1"
            disabled={isUploading}
            required
          />

          <div className="w-full">
            <label htmlFor="document-file" className="mb-2 block text-sm font-medium text-slate-900">
              Dosya
            </label>
            <input
              id="document-file"
              name="file"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
              disabled={isUploading}
              required
              className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-document-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-document-primary-hover"
            />
            <p className="mt-2 text-xs text-slate-500">
              PDF, Word, PowerPoint veya görsel dosyaları desteklenir (maks. 50 MB).
            </p>
          </div>

          <Button
            type="submit"
            disabled={isUploading}
            className="bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document"
          >
            {isUploading ? "Yükleniyor..." : "Dokümanı Yükle"}
          </Button>
        </form>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Yüklenen Dökümanlar</h2>
        <p className="mt-2 text-sm text-slate-600">
          Her döküman için öğrenci notlarını girmek üzere değerlendirme sayfasına gidin.
        </p>

        {isLoadingDocuments ? (
          <p className="mt-6 text-sm text-slate-500">Dökümanlar yükleniyor...</p>
        ) : documents.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">Henüz döküman yüklenmedi.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{document.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(
                      document.createdAt,
                    )}
                  </p>
                </div>
                <Link
                  href={`/admin/evaluate/${document.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-document-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-document-primary-hover hover:shadow-glow-document"
                >
                  Not Gir / Değerlendir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
