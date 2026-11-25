import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import {
  countPdfPagesFromBytes,
  isPdfUpload,
  isPptxUpload,
} from "@/infrastructure/presentations/convert-office-to-pdf";
import { SupabasePresentationRepository } from "@/infrastructure/repositories/supabase-presentation-repository";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export const maxDuration = 60;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
]);

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "presentation.pptx";
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
    const instructorIdsRaw = String(form.get("instructorIds") ?? "");
    const instructorIds = instructorIdsRaw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const originalFileName = String(form.get("originalFileName") ?? "").trim();
    const file = form.get("file");

    if (!title) {
      return NextResponse.json({ error: "Sunum başlığı zorunludur." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "PowerPoint (.pptx) veya PDF dosyası zorunludur." },
        { status: 400 },
      );
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Dosya boyutu 50 MB'ı aşamaz." }, { status: 400 });
    }

    const displayName = originalFileName || file.name;
    const incomingMime = file.type || "application/octet-stream";
    const isPptx = isPptxUpload(file.name, incomingMime) || isPptxUpload(displayName, "");
    const isPdf = isPdfUpload(file.name, incomingMime);

    if (!ALLOWED_MIME.has(incomingMime) && !isPptx && !isPdf) {
      return NextResponse.json(
        { error: "Yalnızca PowerPoint (.pptx) veya PDF yüklenebilir." },
        { status: 400 },
      );
    }
    if (!isPptx && !isPdf) {
      return NextResponse.json(
        { error: "Yalnızca PowerPoint (.pptx) veya PDF yüklenebilir." },
        { status: 400 },
      );
    }

    const {
      data: { user },
    } = await access.client.auth.getUser();

    const service = createServiceRoleClient();
    const bytes = new Uint8Array(await file.arrayBuffer());

    const viewerMime = isPdf
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    const viewerExt = isPdf ? ".pdf" : ".pptx";

    let pageCount = 0;
    if (isPdf) {
      try {
        pageCount = await countPdfPagesFromBytes(bytes);
      } catch (pageError) {
        console.warn("[admin presentations page count]", pageError);
      }
    }

    const baseName = sanitizeFileName(displayName).replace(/\.[^.]+$/, "") || "presentation";
    const storagePath = `${user?.id ?? "admin"}/${Date.now()}-${baseName}${viewerExt}`;

    const { error: uploadError } = await service.storage
      .from("presentations")
      .upload(storagePath, Buffer.from(bytes), {
        contentType: viewerMime,
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
      fileName: displayName,
      mimeType: viewerMime,
      byteSize: bytes.byteLength,
      pageCount,
      createdBy: user?.id ?? null,
      instructorIds,
      isPublished: true,
    });

    return NextResponse.json(
      {
        data: presentation,
        meta: {
          message: isPptx
            ? "PowerPoint yüklendi. Eğitmenler tarayıcıda indirmeden sunabilir."
            : "PDF sunumu yüklendi.",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[admin presentations POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sunum oluşturulamadı." },
      { status: 500 },
    );
  }
}
