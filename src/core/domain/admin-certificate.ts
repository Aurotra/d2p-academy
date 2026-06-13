import type { CertificateStatus } from "@/core/domain/certificate-verification";

export interface AdminCertificateRecord {
  id: string;
  certificateCode: string;
  holderName: string;
  holderEmail: string;
  eventTitle: string;
  issuedAt: Date;
  status: CertificateStatus;
}

export interface PendingCertificateEnrollment {
  id: string;
  studentName: string;
  studentEmail: string;
  eventTitle: string;
  completedAt: Date;
}

export interface IssueCertificateInput {
  enrollmentId: string;
}

export interface RevokeCertificateInput {
  certificateId: string;
  revokeReason: string;
}
