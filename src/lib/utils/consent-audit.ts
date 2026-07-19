import { KVKK_TEXT_VERSION } from "@/shared/constants/kvkk";

export interface ConsentAuditFields {
  accepted_at: string;
  ip: string | null;
  version: string;
}

export function buildConsentAudit(ip: string | null): ConsentAuditFields {
  return {
    accepted_at: new Date().toISOString(),
    ip,
    version: KVKK_TEXT_VERSION,
  };
}

export function mapConsentToColumns(
  prefix: "kvkk_disclosure" | "data_processing_consent" | "marketing_email_consent" | "legal_authority_confirmed",
  audit: ConsentAuditFields,
): Record<string, string | null> {
  // Migration 012 uses kvkk_disclosure_accepted_at (not kvkk_disclosure_at).
  const atSuffix = prefix === "kvkk_disclosure" ? "accepted_at" : "at";

  return {
    [`${prefix}_${atSuffix}`]: audit.accepted_at,
    [`${prefix}_ip`]: audit.ip,
    [`${prefix}_version`]: audit.version,
  };
}
