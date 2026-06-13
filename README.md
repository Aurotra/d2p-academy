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

## Mimari

Clean Architecture prensiplerine uygun klasör yapısı:

- `src/app` — Next.js App Router (sunum katmanı giriş noktası)
- `src/core` — İş kuralları ve use-case'ler
- `src/infrastructure` — Supabase ve dış servis adaptörleri
- `src/presentation` — UI bileşenleri ve hook'lar
- `src/shared` — Paylaşılan tipler, sabitler ve yardımcılar
