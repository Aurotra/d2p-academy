-- D2P Academy | Migration 012
-- KVKK consent audit fields + minor participant flow for registrations.

alter table public.registrations
  add column if not exists is_minor boolean not null default false,
  add column if not exists guardian_name text,
  add column if not exists guardian_phone text,
  add column if not exists kvkk_disclosure_accepted_at timestamptz,
  add column if not exists kvkk_disclosure_ip text,
  add column if not exists kvkk_disclosure_version text,
  add column if not exists data_processing_consent_at timestamptz,
  add column if not exists data_processing_consent_ip text,
  add column if not exists data_processing_consent_version text,
  add column if not exists marketing_email_consent_at timestamptz,
  add column if not exists marketing_email_consent_ip text,
  add column if not exists marketing_email_consent_version text;

alter table public.institution_requests
  add column if not exists kvkk_disclosure_accepted_at timestamptz,
  add column if not exists kvkk_disclosure_ip text,
  add column if not exists kvkk_disclosure_version text,
  add column if not exists data_processing_consent_at timestamptz,
  add column if not exists data_processing_consent_ip text,
  add column if not exists data_processing_consent_version text,
  add column if not exists marketing_email_consent_at timestamptz,
  add column if not exists marketing_email_consent_ip text,
  add column if not exists marketing_email_consent_version text,
  add column if not exists legal_authority_confirmed_at timestamptz,
  add column if not exists legal_authority_confirmed_ip text,
  add column if not exists legal_authority_confirmed_version text;
