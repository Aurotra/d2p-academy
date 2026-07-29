# D2P Academy

Modern, API-driven eğitim platformu (LMS). Next.js, TypeScript, Tailwind CSS ve Supabase ile geliştirilmektedir.

## Gereksinimler

- Node.js 20+
- npm 10+

## Kurulum

```bash
cd "C:\Users\Berk_\Projects\D2P Academy"
npm install
```

## Geliştirme

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production derlemesi |
| `npm run start` | Production sunucusu |
| `npm run lint` | ESLint kontrolü |
| `npm run lint:fix` | ESLint otomatik düzeltme |
| `npm run format` | Prettier ile formatlama |
| `npm run format:check` | Prettier kontrolü |
| `npm run typecheck` | TypeScript tip kontrolü |
| `npm run test` | Birim testleri (Vitest) |
| `npm run check:env` | Production env doğrulama |

## Production ortam değişkenleri

Zorunlu server değişkenleri:

- `SUPABASE_SERVICE_ROLE_KEY` — öğrenci oturumu, rate limit, sitemap
- `STUDENT_JWT_SECRET` — en az 32 karakter
- `RESEND_API_KEY` — kayıt onayı ve bildirim mailleri

Doğrulama: `npm run check:env` (production shell'de env yüklüyken).

Detaylı liste: `.env.example` ve `supabase/README.md`.

## CI

GitHub Actions (`/.github/workflows/ci.yml`): typecheck, lint, test, build.

## Supabase

Migration'lar `supabase/migrations/` altında. Canlıya uygulama:

```bash
supabase link --project-ref <ref>
supabase db push
```

Son kritik migration'lar: **051** (üye işlem logları), **052** (e-posta onay RPC).

## Mimari

Clean Architecture prensiplerine uygun klasör yapısı:

- `src/app` — Next.js App Router (sunum katmanı giriş noktası)
- `src/core` — İş kuralları ve use-case'ler
- `src/infrastructure` — Supabase ve dış servis adaptörleri
- `src/presentation` — UI bileşenleri ve hook'lar
- `src/shared` — Paylaşılan tipler, sabitler ve yardımcılar
