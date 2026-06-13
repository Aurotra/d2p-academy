import type {
  CertificateVerificationResult,
  VerifyCertificateInput,
} from "@/core/domain/certificate-verification";

export interface CertificateRepository {
  verify(input: VerifyCertificateInput): Promise<CertificateVerificationResult>;
}

const CERTIFICATE_CODE_PATTERN = /^D2P-\d{4}-\d{4,}$/i;

export function normalizeCertificateCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidCertificateCodeFormat(code: string): boolean {
  return CERTIFICATE_CODE_PATTERN.test(normalizeCertificateCode(code));
}

export async function verifyCertificate(
  repository: CertificateRepository,
  input: VerifyCertificateInput,
): Promise<CertificateVerificationResult> {
  const normalizedCode = normalizeCertificateCode(input.certificateCode);

  if (!isValidCertificateCodeFormat(normalizedCode)) {
    return {
      isValid: false,
      certificateCode: normalizedCode,
      holderName: null,
      eventTitle: null,
      issuedAt: null,
      status: null,
    };
  }

  return repository.verify({
    ...input,
    certificateCode: normalizedCode,
  });
}
