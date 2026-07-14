import type {
  CertificateVerificationResult,
  VerifyCertificateInput,
} from "@/core/domain/certificate-verification";

export interface CertificateRepository {
  verify(input: VerifyCertificateInput): Promise<CertificateVerificationResult>;
}

/** Legacy: D2P-YYYY-####(+) and program: D2P-CODE-YY-##### */
const LEGACY_CERTIFICATE_CODE_PATTERN = /^D2P-\d{4}-\d{4,}$/i;
const PROGRAM_CERTIFICATE_CODE_PATTERN = /^D2P-[A-Z]{2,4}-\d{2}-\d{5}$/i;

export function normalizeCertificateCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidCertificateCodeFormat(code: string): boolean {
  const normalized = normalizeCertificateCode(code);
  return (
    LEGACY_CERTIFICATE_CODE_PATTERN.test(normalized) ||
    PROGRAM_CERTIFICATE_CODE_PATTERN.test(normalized)
  );
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
