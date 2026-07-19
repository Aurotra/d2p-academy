export interface EnrollmentSummary {
  enrollmentId: string;
  eventTitle: string;
  eventDate: string;
  status: string;
  certificateCode?: string | null;
}

export interface CertificateSummary {
  certificateCode: string;
  issuedAt: string;
  programCode?: string | null;
  verifyUrl?: string | null;
  pdfUrl?: string | null;
}

export interface BadgeSummary {
  code?: string;
  name: string;
  description?: string | null;
  iconUrl: string | null;
  awardedAt: string;
}

export interface PrintWorkOrderSummary {
  id: string;
  itemName: string;
  status: "queued" | "printing" | "ready" | "delivered" | "cancelled";
  requestedAt: string;
}

export interface StudentProgress {
  enrollments: EnrollmentSummary[];
  certificates: CertificateSummary[];
  badges: BadgeSummary[];
}

export interface ChildProgress extends StudentProgress {
  activePrintOrders: PrintWorkOrderSummary[];
}
