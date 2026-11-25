import { NextResponse } from "next/server";

import {
  isPdfUpload,
  isPptxUpload,
} from "@/infrastructure/presentations/convert-office-to-pdf";
import { signPresentationFileToken } from "@/infrastructure/presentations/presentation-file-token";
import { requireInstructorApiAccess } from "@/infrastructure/auth/require-instructor-api-access";
import { SupabasePresentationRepository } from "@/infrastructure/repositories/supabase-presentation-repository";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

type RouteContext = { params: Promise<{ id: string }> };

function getPublicOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return "https://www.d2p.com.tr";
}

export async function GET(request: Request, context: RouteContext) {
  const access = await requireInstructorApiAccess();
  if (access.response) return access.response;

  try {
    const { id } = await context.params;
    const service = createServiceRoleClient();
    const repo = new SupabasePresentationRepository(service);

    const allowed = await repo.instructorHasAccess(id, access.profile.id);
    if (!allowed) {
      return NextResponse.json({ error: "Bu sunuma erişim yetkiniz yok." }, { status: 403 });
    }

    const presentation = await repo.getById(id);
    if (!presentation || !presentation.isPublished) {
      return NextResponse.json({ error: "Sunum bulunamadı." }, { status: 404 });
    }

    const isPdf =
      isPdfUpload(presentation.fileName, presentation.mimeType) ||
      presentation.storagePath.toLowerCase().endsWith(".pdf");
    const isPptx =
      isPptxUpload(presentation.fileName, presentation.mimeType) ||
      presentation.storagePath.toLowerCase().endsWith(".pptx") ||
      presentation.storagePath.toLowerCase().endsWith(".ppt");

    if (!isPdf && !isPptx) {
      return NextResponse.json(
        {
          error:
            "Bu sunum oynatılamıyor. Admin panelinden PowerPoint (.pptx) veya PDF olarak yeniden yükleyin.",
        },
        { status: 415 },
      );
    }

    const signedUrl = await repo.createSignedUrl(presentation.storagePath);
    const viewerKind = isPdf ? "pdf" : "office";

    let officeEmbedUrl: string | null = null;
    if (viewerKind === "office") {
      const fileToken = await signPresentationFileToken({
        presentationId: presentation.id,
        instructorId: access.profile.id,
      });
      // Same-origin proxy — Office Online cannot reliably fetch private Supabase signed URLs.
      const fileUrl = `${getPublicOrigin(request)}/api/v1/presentations/file/${fileToken}`;
      officeEmbedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    }

    return NextResponse.json({
      data: {
        id: presentation.id,
        title: presentation.title,
        description: presentation.description,
        category: presentation.category,
        pageCount: presentation.pageCount,
        fileName: presentation.fileName,
        mimeType: presentation.mimeType,
        viewerKind,
        signedUrl,
        officeEmbedUrl,
        expiresInSeconds: 3600,
      },
    });
  } catch (error) {
    console.error("[instructor presentation access]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erişim alınamadı." },
      { status: 500 },
    );
  }
}
