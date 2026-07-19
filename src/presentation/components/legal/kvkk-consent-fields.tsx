"use client";

import Link from "next/link";

import { KVKK_PAGE_PATH } from "@/shared/constants/kvkk";

interface KvkkConsentFieldsProps {
  kvkkDisclosureAccepted: boolean;
  dataProcessingConsent: boolean;
  marketingEmailConsent: boolean;
  onKvkkDisclosureChange: (value: boolean) => void;
  onDataProcessingChange: (value: boolean) => void;
  onMarketingEmailChange: (value: boolean) => void;
  dataProcessingLabel: string;
  idPrefix?: string;
  /** Optional dedicated legal-authority attestation (kurumsal talep). */
  legalAuthorityConfirmed?: boolean;
  onLegalAuthorityChange?: (value: boolean) => void;
  legalAuthorityLabel?: string;
}

export function KvkkConsentFields({
  kvkkDisclosureAccepted,
  dataProcessingConsent,
  marketingEmailConsent,
  onKvkkDisclosureChange,
  onDataProcessingChange,
  onMarketingEmailChange,
  dataProcessingLabel,
  idPrefix = "consent",
  legalAuthorityConfirmed,
  onLegalAuthorityChange,
  legalAuthorityLabel,
}: KvkkConsentFieldsProps) {
  const kvkkId = `${idPrefix}-kvkk-disclosure`;
  const dataId = `${idPrefix}-data-processing`;
  const legalId = `${idPrefix}-legal-authority`;
  const marketingId = `${idPrefix}-marketing-email`;
  const showLegalAuthority =
    typeof legalAuthorityConfirmed === "boolean" &&
    typeof onLegalAuthorityChange === "function" &&
    Boolean(legalAuthorityLabel);

  return (
    <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <legend className="px-1 text-sm font-semibold text-slate-900">Onaylar</legend>

      <label htmlFor={kvkkId} className="flex items-start gap-3 text-sm leading-6 text-slate-800">
        <input
          id={kvkkId}
          name="kvkk_disclosure"
          type="checkbox"
          required
          checked={kvkkDisclosureAccepted}
          onChange={(event) => onKvkkDisclosureChange(event.target.checked)}
          className="mt-1 size-4 rounded border-slate-300 text-document-primary"
        />
        <span>
          D2P Academy{" "}
          <Link
            href={KVKK_PAGE_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-document-primary underline"
          >
            Aydınlatma Metni&apos;ni
          </Link>{" "}
          okudum ve anladım.
        </span>
      </label>

      <label htmlFor={dataId} className="flex items-start gap-3 text-sm leading-6 text-slate-800">
        <input
          id={dataId}
          name="data_processing_consent"
          type="checkbox"
          required
          checked={dataProcessingConsent}
          onChange={(event) => onDataProcessingChange(event.target.checked)}
          className="mt-1 size-4 rounded border-slate-300 text-document-primary"
        />
        <span>{dataProcessingLabel}</span>
      </label>

      {showLegalAuthority ? (
        <label htmlFor={legalId} className="flex items-start gap-3 text-sm leading-6 text-slate-800">
          <input
            id={legalId}
            name="legal_authority_confirmed"
            type="checkbox"
            required
            checked={legalAuthorityConfirmed}
            onChange={(event) => onLegalAuthorityChange(event.target.checked)}
            className="mt-1 size-4 rounded border-slate-300 text-document-primary"
          />
          <span>{legalAuthorityLabel}</span>
        </label>
      ) : null}

      <label htmlFor={marketingId} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
        <input
          id={marketingId}
          name="marketing_email_consent"
          type="checkbox"
          checked={marketingEmailConsent}
          onChange={(event) => onMarketingEmailChange(event.target.checked)}
          className="mt-1 size-4 rounded border-slate-300 text-document-primary"
        />
        <span>
          Eğitim, etkinlik ve kampanyalarla ilgili tarafıma e-posta ile bilgilendirme yapılmasına
          izin veriyorum.
        </span>
      </label>
    </fieldset>
  );
}
