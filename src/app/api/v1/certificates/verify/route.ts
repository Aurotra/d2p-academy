import { NextResponse } from "next/server";

import { verifyCertificate } from "@/core/use-cases/verify-certificate";
import { SupabaseCertificateRepository } from "@/infrastructure/repositories/supabase-certificate-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

interface VerifyCertificateRequestBody {
  certificateCode?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyCertificateRequestBody;
    const certificateCode = body.certificateCode?.trim() ?? "";

    if (!certificateCode) {
      return NextResponse.json({ error: "Sertifika kodu zorunludur." }, { status: 400 });
    }

    const client = await createSupabaseServerClient();

    if (!client) {
      return NextResponse.json(
        { error: "Supabase yapılandırması bulunamadı. .env dosyanızı kontrol edin." },
        { status: 500 },
      );
    }

    const repository = new SupabaseCertificateRepository(client);
    const result = await verifyCertificate(repository, {
      certificateCode,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Doğrulama sırasında hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
