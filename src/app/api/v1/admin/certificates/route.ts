import { NextResponse } from "next/server";

import {
  issueAdminCertificate,
  listAdminCertificates,
  listPendingCertificateEnrollments,
  revokeAdminCertificate,
} from "@/core/use-cases/manage-admin-certificates";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { issueCertificatePdf } from "@/infrastructure/certificates/issue-certificate-pdf";
import { SupabaseAdminCertificateRepository } from "@/infrastructure/repositories/supabase-admin-certificate-repository";

export const maxDuration = 60;

export async function GET() {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const repository = new SupabaseAdminCertificateRepository(access.client);
    const [certificates, pendingEnrollments] = await Promise.all([
      listAdminCertificates(repository),
      listPendingCertificateEnrollments(repository),
    ]);

    return NextResponse.json({ data: { certificates, pendingEnrollments } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sertifikalar alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as {
      action?: string;
      enrollmentId?: string;
      certificateId?: string;
      revokeReason?: string;
    };
    const repository = new SupabaseAdminCertificateRepository(access.client);

    if (body.action === "issue" && body.enrollmentId) {
      const certificate = await issueAdminCertificate(repository, {
        enrollmentId: body.enrollmentId,
      });

      try {
        const pdfUrl = await issueCertificatePdf(access.client, certificate.id);
        return NextResponse.json({ data: { ...certificate, pdfUrl } }, { status: 201 });
      } catch (pdfError) {
        const pdfMessage =
          pdfError instanceof Error ? pdfError.message : "PDF oluşturulamadı.";
        console.error("[admin certificates issue pdf]", pdfMessage);
        return NextResponse.json(
          {
            data: { ...certificate, pdfUrl: null },
            warning: `Sertifika kaydı oluşturuldu (${certificate.certificateCode}) ancak PDF henüz hazır değil: ${pdfMessage} Listeden «PDF Oluştur» ile tekrar deneyin.`,
          },
          { status: 201 },
        );
      }
    }

    if (body.action === "regenerate-pdf" && body.certificateId) {
      const pdfUrl = await issueCertificatePdf(access.client, body.certificateId);
      return NextResponse.json({ data: { pdfUrl } });
    }

    if (body.action === "revoke" && body.certificateId && body.revokeReason) {
      await revokeAdminCertificate(repository, {
        certificateId: body.certificateId,
        revokeReason: body.revokeReason,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İşlem başarısız oldu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
