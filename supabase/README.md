# D2P Academy — Supabase Migrations

Production-ready PostgreSQL migrations for Supabase.

## Apply migrations

### Supabase CLI (recommended)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Supabase Dashboard

1. Open **SQL Editor** in your Supabase project.
2. Run each migration file in order:
   - `20250613000001_init_enums_and_helpers.sql`
   - `20250613000002_create_core_tables.sql`
   - `20250613000003_auth_profile_and_certificate_logic.sql`
   - `20250613000004_enable_rls_policies.sql`
   - `20250613000005_seed_reference_data.sql` (optional for dev/staging)

## Migration contents

| File | Purpose |
|------|---------|
| 001 | Enum types, `updated_at` trigger helper, role helper functions |
| 002 | Core tables, indexes, foreign keys, `updated_at` triggers |
| 003 | Auth profile bootstrap, certificate code generator, verification RPC |
| 004 | Row Level Security policies |
| 005 | Reference seed data (categories, demo school) |

## Public certificate verification

Use the RPC function from API clients:

```sql
select * from public.verify_certificate('D2P-2026-0001', null, 'web-client');
```

Returns masked holder name and event title for valid certificates.

## Certificate issuance

Admin-only RPC:

```sql
select * from public.issue_certificate('<enrollment_uuid>');
```

Generates codes in `D2P-YYYY-####` format.
