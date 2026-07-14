import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CertificateStatus,
  CertificateVerificationResult,
  VerifyCertificateInput,
} from "@/core/domain/certificate-verification";
import type { CertificateRepository } from "@/core/use-cases/verify-certificate";

interface VerifyCertificateRow {
  is_valid: boolean;
  certificate_code: string;
  holder_name: string | null;
  event_title: string | null;
  issued_at: string | null;
  status: CertificateStatus | null;
}

function mapVerificationResult(row: VerifyCertificateRow): CertificateVerificationResult {
  return {
    isValid: row.is_valid,
    certificateCode: row.certificate_code,
    holderName: row.holder_name,
    eventTitle: row.event_title,
    issuedAt: row.issued_at ? new Date(row.issued_at) : null,
    status: row.status,
  };
}

export class SupabaseCertificateRepository implements CertificateRepository {
  constructor(private readonly client: SupabaseClient) {}

  async verify(input: VerifyCertificateInput): Promise<CertificateVerificationResult> {
    const { data, error } = await this.client.rpc("verify_certificate", {
      p_certificate_code: input.certificateCode,
      p_ip_hash: input.ipHash ?? null,
      p_user_agent: input.userAgent ?? null,
    });

    if (error) {
      throw new Error(`Sertifika doğrulaması başarısız: ${error.message}`);
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      return {
        isValid: false,
        certificateCode: input.certificateCode,
        holderName: null,
        eventTitle: null,
        issuedAt: null,
        status: null,
      };
    }

    return mapVerificationResult(row as VerifyCertificateRow);
  }
}
