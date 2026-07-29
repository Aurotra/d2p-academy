#!/usr/bin/env node

/**
 * Production ortam değişkenlerini doğrular.
 * Kullanım: node scripts/check-production-env.mjs
 * Vercel/PM2 deploy öncesi çalıştırın.
 */

const required = [
  {
    key: "NEXT_PUBLIC_SITE_URL",
    hint: "Örn. https://www.d2p.com.tr",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    hint: "Supabase Project Settings > API",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    hint: "Supabase anon public key",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    hint: "Öğrenci oturumu, rate limit, sitemap için zorunlu",
  },
  {
    key: "STUDENT_JWT_SECRET",
    hint: "En az 32 karakter; Supabase JWT secret ile aynı olmasın",
    minLength: 32,
  },
  {
    key: "RESEND_API_KEY",
    hint: "Kayıt onayı ve eğitmen bildirim mailleri için zorunlu",
  },
];

const recommended = [
  {
    key: "WEBHOOK_SECRET",
    hint: "Supabase Edge Function webhook doğrulaması",
  },
  {
    key: "CHROMIUM_PACK_URL",
    hint: "Vercel'de sertifika PDF üretimi",
  },
];

let hasError = false;

console.log("D2P Academy — production env kontrolü\n");

for (const item of required) {
  const value = process.env[item.key]?.trim() ?? "";
  const ok =
    value.length > 0 && (!item.minLength || value.length >= item.minLength);
  if (!ok) {
    hasError = true;
    console.log(`✗ ${item.key} — EKSİK veya geçersiz (${item.hint})`);
  } else {
    console.log(`✓ ${item.key}`);
  }
}

console.log("\nÖnerilen:");
for (const item of recommended) {
  const value = process.env[item.key]?.trim() ?? "";
  console.log(`${value ? "✓" : "○"} ${item.key} — ${item.hint}`);
}

if (hasError) {
  console.error("\nZorunlu değişkenler eksik. Deploy etmeden önce tamamlayın.");
  process.exit(1);
}

console.log("\nZorunlu production değişkenleri tamam.");
