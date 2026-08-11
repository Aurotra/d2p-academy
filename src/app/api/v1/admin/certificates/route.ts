import { NextResponse } from "next/server";

import type {
  BulkIssueCertificateResult,
  BulkRegeneratePdfResult,
} from "@/core/domain/admin-certificate";
import {
  issueAdminCertificate,
  issueAdminCertificatesBulk,
  listAdminCertificates,
  listPendingCertificateEnrollments,
  revokeAdminCertificate,
} from "@/core/use-cases/manage-admin-certificates";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { issueCertificatePdf } from "@/infrastructure/certificates/issue-certificate-pdf";
import { SupabaseAdminCertificateRepository } from "@/infrastructure/repositories/supabase-admin-certificate-repository";
import { apiCatchResponse } from "@/shared/utils/api-error";

export const maxDuration = 60;

function collectEnrollmentIds(body: {
  enrollmentId?: string;
  enrollmentIds?: string[];
}): string[] {
  const ids = new Set<string>();
  if (body.enrollmentId) {
    ids.add(body.enrollmentId);
  }
  for (const id of body.enrollmentIds ?? []) {
    if (id) {
      ids.add(id);
    }
  }
  return [...ids];
}

function collectCertificateIds(body: {
  certificateId?: string;
  certificateIds?: string[];
}): string[] {
  const ids = new Set<string>();
  if (body.certificateId) {
    ids.add(body.certificateId);
  }
  for (const id of body.certificateIds ?? []) {
    if (id) {
      ids.add(id);
    }
  }
  return [...ids];
}

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
    return apiCatchResponse(error, "Sertifikalar alınamadı.", {
      logLabel: "[admin/certificates GET]",
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as {
      action?: string;
      enrollmentId?: string;
      enrollmentIds?: string[];
      certificateId?: string;
      certificateIds?: string[];
      revokeReason?: string;
      generatePdf?: boolean;
    };
    const repository = new SupabaseAdminCertificateRepository(access.client);

    if (body.action === "issue") {
      const enrollmentIds = collectEnrollmentIds(body);
      if (enrollmentIds.length !== 1) {
        return NextResponse.json({ error: "Tek kayıt seçilmelidir." }, { status: 400 });
      }

      const certificate = await issueAdminCertificate(repository, {
        enrollmentId: enrollmentIds[0]!,
      });

      try {
        const pdfUrl = await issueCertificatePdf(access.client, certificate.id);
        return NextResponse.json({ data: { ...certificate, pdfUrl } }, { status: 201 });
      } catch (pdfError) {
        console.error("[admin certificates issue pdf]", pdfError);
        return NextResponse.json(
          {
            data: { ...certificate, pdfUrl: null },
            warning: `Sertifika kaydı oluşturuldu (${certificate.certificateCode}) ancak PDF henüz hazır değil. Listeden «PDF Oluştur» ile tekrar deneyin.`,
          },
          { status: 201 },
        );
      }
    }

    if (body.action === "bulk-issue") {
      const enrollmentIds = collectEnrollmentIds(body);
      if (enrollmentIds.length === 0) {
        return NextResponse.json({ error: "En az bir kayıt seçilmelidir." }, { status: 400 });
      }

      const shouldGeneratePdf = body.generatePdf !== false;
      const bulkResult = await issueAdminCertificatesBulk(repository, { enrollmentIds });
      const result: BulkIssueCertificateResult = {
        succeeded: [],
        failed: bulkResult.failed,
      };

      for (const item of bulkResult.succeeded) {
        if (!shouldGeneratePdf) {
          result.succeeded.push({
            ...item,
            pdfUrl: item.certificate.pdfUrl,
          });
          continue;
        }

        try {
          const pdfUrl = await issueCertificatePdf(access.client, item.certificate.id);
          result.succeeded.push({
            ...item,
            certificate: { ...item.certificate, pdfUrl },
            pdfUrl,
          });
        } catch (pdfError) {
          console.error("[admin certificates bulk-issue pdf]", pdfError);
          result.succeeded.push({
            ...item,
            pdfUrl: null,
            pdfWarning:
              "Sertifika kaydı oluşturuldu ancak PDF henüz hazır değil. «PDF Oluştur» ile tekrar deneyin.",
          });
        }
      }

      return NextResponse.json({ data: result }, { status: 201 });
    }

    if (body.action === "regenerate-pdf") {
      const certificateIds = collectCertificateIds(body);
      if (certificateIds.length !== 1) {
        return NextResponse.json({ error: "Tek sertifika seçilmelidir." }, { status: 400 });
      }

      const pdfUrl = await issueCertificatePdf(access.client, certificateIds[0]!);
      return NextResponse.json({ data: { pdfUrl } });
    }

    if (body.action === "bulk-regenerate-pdf") {
      const certificateIds = collectCertificateIds(body);
      if (certificateIds.length === 0) {
        return NextResponse.json({ error: "En az bir sertifika seçilmelidir." }, { status: 400 });
      }

      const result: BulkRegeneratePdfResult = { succeeded: [], failed: [] };

      for (const certificateId of certificateIds) {
        try {
          const pdfUrl = await issueCertificatePdf(access.client, certificateId);
          result.succeeded.push({ certificateId, pdfUrl });
        } catch (pdfError) {
          console.error("[admin certificates bulk-regenerate-pdf]", pdfError);
          result.failed.push({
            certificateId,
            error: pdfError instanceof Error ? pdfError.message : "PDF oluşturulamadı.",
          });
        }
      }

      return NextResponse.json({ data: result });
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
    return apiCatchResponse(error, "İşlem başarısız oldu.", {
      logLabel: "[admin/certificates POST]",
      status: 400,
    });
  }
}
