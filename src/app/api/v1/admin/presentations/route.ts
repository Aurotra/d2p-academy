import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabasePresentationRepository } from "@/infrastructure/repositories/supabase-presentation-repository";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
]);

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "presentation.pdf";
}

export async function GET() {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const service = createServiceRoleClient();
    const repo = new SupabasePresentationRepository(service);
    const items = await repo.listAllForAdmin();
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("[admin presentations GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sunumlar alınamadı." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    const pageCount = Number(form.get("pageCount") ?? 0);
    const instructorIdsRaw = String(form.get("instructorIds") ?? "");
    const instructorIds = instructorIdsRaw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const file = form.get("file");

    if (!title) {
      return NextResponse.json({ error: "Sunum başlığı zorunludur." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "PDF dosyası zorunludur." }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Dosya boyutu 50 MB'ı aşamaz." }, { status: 400 });
    }

    const mimeType = file.type || "application/pdf";
    if (!ALLOWED_MIME.has(mimeType) && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Yalnızca PDF (önerilen) veya PPTX yüklenebilir. Oynatıcı PDF gerektirir." },
        { status: 400 },
      );
    }

    const {
      data: { user },
    } = await access.client.auth.getUser();

    const service = createServiceRoleClient();
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${user?.id ?? "admin"}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await service.storage.from("presentations").upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
      cacheControl: "3600",
    });
    if (uploadError) {
      return NextResponse.json({ error: `Yükleme hatası: ${uploadError.message}` }, { status: 500 });
    }

    const repo = new SupabasePresentationRepository(service);
    const presentation = await repo.create({
      title,
      description,
      category,
      storagePath,
      fileName: file.name,
      mimeType,
      byteSize: file.size,
      pageCount: Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0,
      createdBy: user?.id ?? null,
      instructorIds,
      isPublished: true,
    });

    return NextResponse.json({ data: presentation }, { status: 201 });
  } catch (error) {
    console.error("[admin presentations POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sunum oluşturulamadı." },
      { status: 500 },
    );
  }
}
