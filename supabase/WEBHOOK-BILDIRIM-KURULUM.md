# D2P Academy — Veritabanı Webhook Bildirim Kurulum Rehberi

Bu rehber, `grades`, `documents` ve `registrations` tablolarına yeni kayıt eklendiğinde **otomatik e-posta** gönderen `notify-user` Edge Function kurulumunu anlatır.

---

## 1. Gerekli hesaplar ve anahtarlar

| Değişken | Nereden alınır |
|----------|----------------|
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Aynı sayfa (**gizli tutun**) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `WEBHOOK_SECRET` | Siz belirleyin (uzun rastgele bir metin) |
| `ADMIN_EMAIL` | Ön kayıt bildirimlerinin gideceği admin e-postası |

Örnek secret üretmek için PowerShell:

```powershell
[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
```

---

## 2. Resend domain ayarı

Gönderici adresi: **D2P Academy &lt;bildirim@d2pacademy.com&gt;**

1. Resend → **Domains** → `d2pacademy.com` ekleyin
2. DNS kayıtlarını (SPF, DKIM) domain sağlayıcınıza girin
3. Domain **Verified** olunca e-postalar gönderilebilir

---

## 3. Edge Function deploy

Proje klasöründe (Supabase CLI kurulu olmalı):

```cmd
cd "C:\Users\Berk_\Projects\D2P Academy"
supabase login
supabase link --project-ref VURZMPBWLGAHZBILQSFA
```

Secret'ları function'a tanımlayın:

```cmd
supabase secrets set WEBHOOK_SECRET=buraya-uzun-secret-yazin
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set SUPABASE_URL=https://vurzmpbwlgahzbilqsfa.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role_key...
supabase secrets set ADMIN_EMAIL=admin@ornek.com
```

Function'ı deploy edin:

```cmd
supabase functions deploy notify-user --no-verify-jwt
```

Deploy sonrası URL örneği:

```
https://vurzmpbwlgahzbilqsfa.supabase.co/functions/v1/notify-user
```

> `--no-verify-jwt` kullanın; webhook Supabase JWT göndermez, `x-webhook-secret` ile korunur.

---

## 4. Supabase Database Webhooks

Supabase Dashboard → **Database** → **Webhooks** → **Create a new hook**

### Webhook A — Not bildirimi (`grades`)

| Alan | Değer |
|------|--------|
| **Name** | `notify-grade-insert` |
| **Table** | `grades` |
| **Events** | `INSERT` (isteğe bağlı: `UPDATE` de ekleyin — upsert güncellemede de mail gider) |
| **HTTP Request URL** | `https://VURZMPBWLGAHZBILQSFA.supabase.co/functions/v1/notify-user` |
| **HTTP Headers** | `x-webhook-secret` = `[WEBHOOK_SECRET değeriniz]` |
| **HTTP Method** | `POST` |

### Webhook B — Yeni döküman bildirimi (`documents`)

| Alan | Değer |
|------|--------|
| **Name** | `notify-document-insert` |
| **Table** | `documents` |
| **Events** | `INSERT` |
| **HTTP Request URL** | Aynı function URL |
| **HTTP Headers** | Aynı `x-webhook-secret` |

### Webhook C — Ön kayıt bildirimi (`registrations`)

| Alan | Değer |
|------|--------|
| **Name** | `notify-registration-insert` |
| **Table** | `registrations` |
| **Events** | `INSERT` |
| **HTTP Request URL** | Aynı function URL |
| **HTTP Headers** | Aynı `x-webhook-secret` |

> Ön kayıt webhook'u kurulmadan form çalışır; sadece admin'e otomatik e-posta gitmez.

---

## 5. Test

### Not bildirimi testi

1. Admin → **Dökümanlar** → bir döküman için **Not Gir / Değerlendir**
2. Öğrenciye puan kaydedin
3. Öğrencinin e-postasına **"Yeni Notunuz Yayınlandı"** maili gelmeli

### Döküman bildirimi testi

1. Admin → **Dökümanlar** → yeni PDF yükleyin
2. Kayıtlı tüm öğrencilere **"Yeni Döküman Paylaşıldı"** maili gider

### Ön kayıt bildirimi testi

1. Ana sayfa → **Ön Kayıt Ol** veya `/kayit` formunu doldurun
2. `ADMIN_EMAIL` adresine **"Yeni Ön Kayıt: ..."** başlıklı mail gelmeli
3. Admin → **Ön Kayıtlar** sayfasında kayıt görünmeli

---

## 6. Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| `401 Unauthorized` | `x-webhook-secret` webhook ile function secret aynı mı kontrol edin |
| Mail gitmiyor | Resend domain verified mı? `RESEND_API_KEY` doğru mu? |
| Function log | Supabase → **Edge Functions** → `notify-user` → **Logs** |
| Öğrenci maili yok | `profiles.email` ve auth kullanıcı e-postası dolu olmalı |

---

## 7. E-posta tasarımı

- Inline CSS (e-posta istemcileri için)
- Ana vurgu rengi: `#2563eb`
- Logo: `https://d2pacademy.com/logo.png`
- Footer: `© 2025 D2P Academy | ATH Mühendislik`

Şablon dosyası: `supabase/functions/notify-user/email-templates.ts`

---

## 8. Güvenlik notları

- `SUPABASE_SERVICE_ROLE_KEY` asla frontend'e veya GitHub'a koymayın
- `WEBHOOK_SECRET` sadece Supabase webhook header'ında ve function secret'ında kullanılsın
- Service role key sadece Edge Function ortamında kalsın
