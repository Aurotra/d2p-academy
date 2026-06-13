export type CertificateStatus = "active" | "revoked";

export interface CertificateVerificationResult {
  isValid: boolean;
  certificateCode: string;
  holderName: string | null;
  eventTitle: string | null;
  issuedAt: Date | null;
  status: CertificateStatus | null;
}

export interface VerifyCertificateInput {
  certificateCode: string;
  ipHash?: string | null;
  userAgent?: string | null;
}
