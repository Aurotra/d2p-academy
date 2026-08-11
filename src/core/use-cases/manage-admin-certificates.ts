import type {
  AdminCertificateRecord,
  BulkIssueCertificateInput,
  BulkIssueCertificateResult,
  IssueCertificateInput,
  PendingCertificateEnrollment,
  RevokeCertificateInput,
} from "@/core/domain/admin-certificate";

export interface AdminCertificateRepository {
  listAll(): Promise<AdminCertificateRecord[]>;
  listPendingEnrollments(): Promise<PendingCertificateEnrollment[]>;
  issue(input: IssueCertificateInput): Promise<AdminCertificateRecord>;
  issueMany(input: BulkIssueCertificateInput): Promise<BulkIssueCertificateResult>;
  revoke(input: RevokeCertificateInput): Promise<void>;
}

export async function listAdminCertificates(
  repository: AdminCertificateRepository,
): Promise<AdminCertificateRecord[]> {
  return repository.listAll();
}

export async function listPendingCertificateEnrollments(
  repository: AdminCertificateRepository,
): Promise<PendingCertificateEnrollment[]> {
  return repository.listPendingEnrollments();
}

export async function issueAdminCertificate(
  repository: AdminCertificateRepository,
  input: IssueCertificateInput,
): Promise<AdminCertificateRecord> {
  return repository.issue(input);
}

export async function issueAdminCertificatesBulk(
  repository: AdminCertificateRepository,
  input: BulkIssueCertificateInput,
): Promise<BulkIssueCertificateResult> {
  return repository.issueMany(input);
}

export async function revokeAdminCertificate(
  repository: AdminCertificateRepository,
  input: RevokeCertificateInput,
): Promise<void> {
  return repository.revoke(input);
}
