import type { CertificateStatus } from "@/core/domain/certificate-verification";

export interface AdminCertificateRecord {
  id: string;
  certificateCode: string;
  holderName: string;
  holderEmail: string;
  eventId: string;
  eventTitle: string;
  issuedAt: Date;
  status: CertificateStatus;
  pdfUrl: string | null;
}

export interface PendingCertificateEnrollment {
  id: string;
  studentName: string;
  studentEmail: string;
  eventId: string;
  eventTitle: string;
  completedAt: Date;
  /** Forms done but profile < 100% — not issuable yet. */
  profileIncomplete?: boolean;
  profileProgress?: number;
  /** Forms done but yoklama eşiği karşılanmadı — not issuable yet. */
  attendanceIncomplete?: boolean;
  presentCount?: number;
  requiredLessonCount?: number;
  totalLessonCount?: number;
}

export interface IssueCertificateInput {
  enrollmentId: string;
  /** Admin only: skip profile %100 and attendance threshold (forms still required). */
  skipEligibilityGates?: boolean;
}

export interface RevokeCertificateInput {
  certificateId: string;
  revokeReason: string;
}

export interface BulkIssueCertificateInput {
  enrollmentIds: string[];
  skipEligibilityGates?: boolean;
}

export interface BulkIssueCertificateSuccess {
  enrollmentId: string;
  certificate: AdminCertificateRecord;
  pdfUrl: string | null;
  pdfWarning?: string;
}

export interface BulkIssueCertificateFailure {
  enrollmentId: string;
  error: string;
}

export interface BulkIssueCertificateResult {
  succeeded: BulkIssueCertificateSuccess[];
  failed: BulkIssueCertificateFailure[];
}

export interface BulkRegeneratePdfInput {
  certificateIds: string[];
}

export interface BulkRegeneratePdfSuccess {
  certificateId: string;
  pdfUrl: string;
}

export interface BulkRegeneratePdfFailure {
  certificateId: string;
  error: string;
}

export interface BulkRegeneratePdfResult {
  succeeded: BulkRegeneratePdfSuccess[];
  failed: BulkRegeneratePdfFailure[];
}
