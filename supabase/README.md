# D2P Academy — Supabase Migrations

Production-ready PostgreSQL migrations for Supabase. Repoda **52** sıralı migration dosyası bulunur (`supabase/migrations/`).

> **Önemli:** `KURULUM-TAMAMI.sql` artık güncel değildir. Yeni kurulumlarda yalnızca `supabase db push` veya CLI migration akışını kullanın.

## Apply migrations

### Supabase CLI (önerilen)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Canlı projede eksik migration kontrolü

Dashboard → **Database** → **Migrations** veya CLI:

```bash
supabase migration list
```

Son eklenen kritik migration'lar:

| Dosya | Açıklama |
|-------|----------|
| `20250613000051_member_activity_audit_logs.sql` | Veli/öğrenci panel işlem logları |
| `20250613000052_auth_email_awaiting_confirmation_rpc.sql` | Onay bekleyen e-posta RPC (giriş mesajları) |

## Migration grupları (özet)

| Aralık | Konu |
|--------|------|
| 001–005 | Çekirdek şema, RLS, referans seed |
| 006–018 | Profil, belgeler, sertifika, kayıt |
| 019–029 | Galeri, formlar, kampanya, site ayarları |
| 030–035 | Hibrit öğrenci auth, form RPC, sertifika gate |
| 036–045 | Çocuk profili, yoklama, eğitmen capability, kategoriler |
| 046–052 | Admin audit, kurs talebi, programlar, üye logları, auth RPC |

Tam liste: `ls supabase/migrations` veya migration dosya adlarına göre sıralı çalıştırın.

## Public certificate verification

```sql
select * from public.verify_certificate('D2P-2026-0001', null, 'web-client');
```

## Certificate issuance (admin)

```sql
select * from public.issue_certificate('<enrollment_uuid>');
```

## Otomatik e-posta bildirimleri

Edge Functions + Resend:

- Kod: `supabase/functions/`
- Kurulum: [`WEBHOOK-BILDIRIM-KURULUM.md`](./WEBHOOK-BILDIRIM-KURULUM.md)

## Production checklist

- [ ] `supabase db push` ile tüm migration'lar uygulandı
- [ ] `RESEND_API_KEY` Vercel + Supabase secrets'ta tanımlı
- [ ] `SUPABASE_SERVICE_ROLE_KEY` server ortamında tanımlı
- [ ] `STUDENT_JWT_SECRET` (≥32 karakter) tanımlı
- [ ] Resend gönderici domain (`d2p.com.tr`) doğrulandı
