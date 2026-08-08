import { NextResponse } from "next/server";

import { verifyCertificate } from "@/core/use-cases/verify-certificate";
import { enforcePublicPostRateLimit } from "@/infrastructure/auth/public-post-rate-limit";
import { SupabaseCertificateRepository } from "@/infrastructure/repositories/supabase-certificate-repository";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { hashClientIp } from "@/lib/utils/hash-ip";
import { getClientIp } from "@/lib/utils/request-ip";
import { apiCatchResponse } from "@/shared/utils/api-error";

/** ~15 verification attempts / 15 min per IP. */
const CERT_VERIFY_MAX = 15;
const CERT_VERIFY_WINDOW_MS = 15 * 60 * 1000;

interface VerifyCertificateRequestBody {
  certificateCode?: string;
}

export async function POST(request: Request) {
  try {
    const rateLimited = await enforcePublicPostRateLimit(request, "certificate-verify", {
      maxAttempts: CERT_VERIFY_MAX,
      windowMs: CERT_VERIFY_WINDOW_MS,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const body = (await request.json()) as VerifyCertificateRequestBody;
    const certificateCode = body.certificateCode?.trim() ?? "";

    if (!certificateCode) {
      return NextResponse.json({ error: "Sertifika kodu zorunludur." }, { status: 400 });
    }

    const client = createServiceRoleClient();
    const repository = new SupabaseCertificateRepository(client);
    const result = await verifyCertificate(repository, {
      certificateCode,
      ipHash: hashClientIp(getClientIp(request)),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return apiCatchResponse(error, "Doğrulama sırasında hata oluştu.", {
      logLabel: "[certificates/verify]",
      status: 500,
    });
  }
}
