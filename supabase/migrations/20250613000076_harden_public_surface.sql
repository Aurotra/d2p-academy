-- D2P Academy | Migration 076
-- Close anon direct-write abuse paths and restrict certificate verification RPC to service_role.
-- Public forms must go through Next.js API (service role insert / rate-limited verify).

-- ---------------------------------------------------------------------------
-- 1) registrations — no direct client INSERT
-- ---------------------------------------------------------------------------
drop policy if exists "registrations_anon_insert" on public.registrations;
drop policy if exists "registrations_authenticated_insert" on public.registrations;

-- ---------------------------------------------------------------------------
-- 2) institution_requests — no direct client INSERT
-- ---------------------------------------------------------------------------
drop policy if exists "institution_requests_anon_insert" on public.institution_requests;
drop policy if exists "institution_requests_authenticated_insert" on public.institution_requests;

-- ---------------------------------------------------------------------------
-- 3) verify_certificate — service_role only (API gateway)
-- ---------------------------------------------------------------------------
revoke execute on function public.verify_certificate(text, text, text) from anon, authenticated, public;
grant execute on function public.verify_certificate(text, text, text) to service_role;

comment on function public.verify_certificate(text, text, text) is
  'Certificate verification; callable only via service_role (Next.js /api/v1/certificates/verify).';
