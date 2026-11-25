import { NextResponse } from "next/server";

import { verifyPresentationFileToken } from "@/infrastructure/presentations/presentation-file-token";
import { SupabasePresentationRepository } from "@/infrastructure/repositories/supabase-presentation-repository";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

type RouteContext = { params: Promise<{ token: string }> };

/**
 * Cookie-free file stream for Microsoft Office Online.
 * Private Supabase signed URLs often fail inside view.officeapps.live.com;
 * Office fetches this same-origin URL instead.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const payload = await verifyPresentationFileToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı." }, { status: 401 });
    }

    const service = createServiceRoleClient();
    const repo = new SupabasePresentationRepository(service);
    const allowed = await repo.instructorHasAccess(payload.pid, payload.iid);
    if (!allowed) {
      return NextResponse.json({ error: "Erişim yok." }, { status: 403 });
    }

    const presentation = await repo.getById(payload.pid);
    if (!presentation || !presentation.isPublished) {
      return NextResponse.json({ error: "Sunum bulunamadı." }, { status: 404 });
    }

    const { data, error } = await service.storage
      .from("presentations")
      .download(presentation.storagePath);

    if (error || !data) {
      console.error("[presentation file proxy]", error);
      return NextResponse.json({ error: "Dosya indirilemedi." }, { status: 502 });
    }

    const bytes = Buffer.from(await data.arrayBuffer());
    const rawName = presentation.fileName || "presentation.pptx";
    const fileName = /\.pptx?$/i.test(rawName)
      ? rawName.replace(/"/g, "")
      : `${rawName.replace(/"/g, "")}.pptx`;
    const contentType =
      presentation.mimeType ||
      "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, max-age=300",
        // Office Online fetch should not be blocked by CORS preflight edge cases.
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[presentation file proxy]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Dosya alınamadı." },
      { status: 500 },
    );
  }
}
