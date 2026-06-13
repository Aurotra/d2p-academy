import type { CertificateStatus } from "@/core/domain/certificate-verification";
import type { AcademyEvent } from "@/core/domain/event";
import type { Profile } from "@/core/domain/auth";

export type EnrollmentStatus =
  | "registered"
  | "attended"
  | "completed"
  | "cancelled"
  | "no_show";

export interface StudentEnrollment {
  id: string;
  status: EnrollmentStatus;
  registeredAt: Date;
  event: AcademyEvent;
}

export interface StudentCertificate {
  id: string;
  certificateCode: string;
  eventTitle: string;
  issuedAt: Date;
  status: CertificateStatus;
}

export interface StudentDashboardData {
  profile: Profile;
  upcomingEnrollments: StudentEnrollment[];
  certificates: StudentCertificate[];
}
