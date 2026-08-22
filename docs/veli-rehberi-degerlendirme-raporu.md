# Veli Rehberi Kalite Değerlendirme Raporu

> **Not:** Bu rapor 22 Ağustos 2026'daki refactor öncesi durumu belgelemektedir. Raporda önerilen değişikliklerin çoğu (Yol 1/Yol 2 ayrımı, SSS daraltma, F-kodu temizliği) 63ad75b ve 70cf8d6 commit'leriyle uygulanmıştır. Güncel rehber içeriği için parent-guide-content.tsx dosyasına bakın.

**İncelenen dosya:** `src/presentation/components/guides/parent-guide-content.tsx`  
**Sayfa yolu:** `/veli-rehberi`  
**Değerlendirme tarihi:** 22 Ağustos 2026  
**Son güncelleme sabiti:** `src/shared/constants/parent-guide.ts` → `PARENT_GUIDE_UPDATED`

---

## Özet

Veli rehberi kapsamlı ve işlevsel; ancak dört alanda iyileştirme fırsatı var: iç form kodlarının veli metninde kullanımı, yüksek tekrar oranı, kodda kısmen çözülmüş bir UX sorununun rehberde hâlâ anlatılması ve iki kayıt yolunun (etkinlik vs. kurs talebi) akış sırasının net ayrılmaması.

---

## 1. Veli İçin Gereksiz İç Kodlama ve Teknik Detaylar

### Tespit

**Var.** F01, F02, F03, F05, F06, F07 kodları veliye yönelik metinlerde yoğun kullanılıyor. Tablo başlıkları kısmen sade (“1. Tanışma”, “2. Onaylar”) olsa da gövde metinleri iç kodları tekrarlıyor.

### Kanıt

| Konum | Satır | Örnek |
|-------|-------|-------|
| Hızlı kontrol listesi | 19 | `"Tanışma (F01) ve ön test (F02) ile onayları (F05–F07)..."` |
| SSS — “Hangi formlar var?” | 102 | `"Tanışma (F01 + ... ön test F02), 2) Onaylar (F05, F06, F07), 3) ... (F03 ...)"` |
| SSS — “Formları ne zaman?” | 107 | `"Son test (F03) etkinlik günü..."` |
| Bölüm 7 — formlar tablosu | 428–441 | `"F01 tanıma formu"`, `"F05, F06 ... F07"`, `"F06'da tüm kalemlerde"`, `"(F03)"` |

**Karşı örnek (doğru yön):** Satır 428, 435, 440, 447 — tablo “Adım” sütununda sade başlıklar kullanılıyor; “Ne var?” sütunu kodları sızdırıyor.

### Ciddiyet

**Orta.** Veli anlayabilir ama jargon güveni düşürür; panelde “Tanışma / Onaylar” görürken rehberde F06 araması kafa karıştırır.

### Önerilen çözüm

1. Tüm veli metinlerinden Fxx kodlarını kaldır; yalnızca paneldeki adım adlarıyla hizala.
2. Checklist satır 19’u şöyle değiştir:

   > Tanışma ve ön değerlendirme ile veli onay formlarını kayıttan hemen sonra tamamlayın. Son değerlendirme yalnızca 2–8. sınıflarda, etkinlik sonrası açılır.

3. SSS “Hangi formlar var?” cevabını tablo ile aynı sade dilde yaz:

   | Adım | Veli panelinde görünen ad | Ne zaman? |
   |------|---------------------------|-----------|
   | 1 | Tanışma | Kayıttan hemen sonra |
   | 2 | Onaylar (medya ve katılım izinleri) | Tanışma bitince |
   | 3 | Son test | Etkinlik sonrası (2–8. sınıf) |
   | 4 | Sertifika onay | Formlar + profil tamam |

4. İç kodlar yalnızca admin/teknik dokümantasyonda kalsın.

---

## 2. Yoğun Bilgi Tekrarı (Sayfa Şişkinliği)

### Tespit

**Var.** Aynı akış dört katmanda tekrarlanıyor; SSS’nin önemli kısmı gövdeyle birebir örtüşüyor, troubleshooting değil.

### Kanıt ve tekrar haritası

| Konu | Hızlı kontrol listesi | Gövde (1–8) | SSS | Kısa özet |
|------|----------------------|-------------|-----|-----------|
| Veli hesabı | 9–11 | §1 (152–161) | 25–27, 35–37 | 490–491 |
| Çocuk ekle / kullanıcı adı | 12–13 | §2 (165–205) | 30–32, 45–47, 55–57 | 492–493 |
| Veli vs öğrenci girişi | — | §3 (208–242) | 50–52 | 499 |
| Etkinliğe kayıt | 15 | §4 (245–259) | 60–62 | 494 |
| Ödeme | 16, 18 | §5 (262–355) | 70–87 | 495 |
| Kurs talebi | 17 | §6 (358–386) | 60–62, 65–67 | 496 |
| Form yolu ve sırası | 18–19 | §7 (389–458) | 95–107 | 497 |
| Profil %100 | 14, 20 | §8 (461–468) | 110–117 | 498 |

**Tekrar oranı (yaklaşık):**

- Checklist ↔ Kısa özet: **~85%** örtüşme (12 madde vs 9 satırlık özet; aynı sıra).
- SSS ↔ Gövde: **~10 / 19 soru** (%53) doğrudan bölüm tekrarı:
  - “Uygun etkinlik yoksa” ≈ §6
  - “Formları nerede / hangi / ne zaman” ≈ §7
  - “Ödeme nasıl yapılır?” ≈ §5
  - “Profilde veli telefon” ≈ §8
- Profil %100: checklist’te **iki kez** (14 ve 20).

**SSS troubleshooting odaklı mı?** Kısmen. Gerçek troubleshooting: e-posta onayı (35–37), e-posta çakışması (40–42), tarayıcı otomatik doldurma (45–47), yarım ödeme (75–77), iptal/iade (85–87). Geri kalan sorular süreç anlatımı.

### Ciddiyet

**Orta.** Sayfa uzun; mobilde kaydırma yükü artar; güncellemede dört yer senkron tutulmalı.

### Önerilen çözüm

1. **Kısa özeti kaldır** veya checklist altına “Paylaş / kopyala” butonuyla tek kaynaktan üret (DRY).
2. **Checklist’i koru** — tek bakışta akış için en değerli blok.
3. **SSS’yi daralt (~8–10 soru):** yalnızca hata/istisna senaryoları:
   - E-posta onayı gelmedi
   - Bu e-posta zaten kayıtlı
   - Ad Soyad alanına veli e-postası yazılıyor
   - Ödemeyi yarım bıraktım
   - Kurs talebinde profil seçmedim (istisna)
   - İptal ve iade
4. Süreç detayını §1–8’de bırak; SSS’den “Formları nerede?”, “Hangi formlar var?”, “Ödeme nasıl yapılır?” gibi tekrarlayan maddeleri çıkar.
5. Checklist satır 20’yi kaldır (14 ile birleştir).

**Tahmini kısalma:** ~25–30% metin azaltımı.

---

## 3. Yazılımsal Eksikliklerin Rehberde İtiraf Edilmesi

### Tespit

**Kısmen var.** Rehber, tarayıcının Ad Soyad alanına veli e-postası yazmasını veliye “silip düzelt” diye anlatıyor. Kod tarafında ise sorun için önlem **zaten uygulanmış**; rehber güncel değil veya yedek uyarı olarak fazla öne çıkıyor.

### Kanıt

**Rehber metni:**

| Konum | Satır | Metin |
|-------|-------|-------|
| SSS | 45–47 | `"Hayır — bu tarayıcının otomatik doldurmasıdır... Veli e-postası bu alana girilmemelidir."` |
| §2 uyarı kutusu | 201–204 | `"Tarayıcı Ad Soyad alanına veli e-postanızı otomatik yazarsa silip çocuğun adını girin."` |

**Kod (çocuk ekle formu):** `src/presentation/components/dashboard/children-students-client.tsx`

```tsx
// Satır 680–691
<form autoComplete="off" onSubmit={handleSubmit}>
  <Input
    id="child-full-name"
    name="child-full-name"
    autoComplete="off"
    readOnly
    onFocus={(event) => event.currentTarget.removeAttribute("readonly")}
    ...
  />
```

Form seviyesinde `autoComplete="off"`, alan adı `child-full-name` (e-posta alias’ından uzak), `autoComplete="off"` + readonly-on-focus trick mevcut.

### Ciddiyet

**Düşük–orta.** Kod iyileştirmesi yapılmış; rehber hâlâ birincil çözümü kullanıcıya yükletiyor. Bazı tarayıcılar yine de yanlış doldurabilir — kısa SSS maddesi kalabilir ama §2’deki büyük uyarı kutusu gereksiz vurgulu.

### Önerilen çözüm

**Kod (ince ayar, isteğe bağlı):**

```tsx
<Input
  id="child-full-name"
  name="child-full-name"
  autoComplete="name"          // e-posta yerine isim ipucu
  inputMode="text"
  ...
/>
```

`readOnly` trick korunabilir; `name="child-full-name"` yerine standart `name="name"` + `autoComplete="name"` genelde daha tutarlıdır.

**Rehber:**

- §2 uyarı kutusunu kısalt veya kaldır.
- SSS maddesini troubleshooting tonunda tut: *“Nadiren tarayıcı yanlış öneri gösterebilir; alanın çocuğun adı olduğundan emin olun.”*

Öncelik: rehber metnini sadeleştirmek (kod zaten savunma içeriyor).

---

## 4. Mantıksal / Akış Uyuşmazlığı

### Tespit

**Kısmen var.** Etkinlik kaydı ile kurs talebi iki farklı yol; rehber bunları checklist sırasında ardışık adım gibi gösteriyor. “Profil %100” kuralı etkinlik kaydı için doğru; kurs talebi için esnetilmiş — bu ayrım her yerde net değil.

### Kanıt

**Çelişkiye yol açan ifadeler:**

| Konum | Satır | İfade |
|-------|-------|-------|
| Checklist | 14–17 | Önce profil doldur → etkinlik kaydı → ödeme → **ardından** kurs talebi (alternatif yol sıralı gibi) |
| Checklist | 14 + 20 | Profil %100 iki kez; biri kayıt öncesi, biri sonda |
| §8 | 466 | `"Profil %100 olmadan etkinliğe kayıt ve sertifika verilemez."` |
| §6 | 376–377, 384–385 | Kurs talebinde profil yoksa sadece isim yazılabilir; sınıf açılınca profil oluşturulur |
| Header | 134–136 | `"doğrudan kayıt olabilir"` — profil önkoşulu belirtilmiyor |

**Uygulama davranışı (referans):**

- `src/shared/utils/event-enrollment.ts:46–48` — `isChildProfileReadyForEnrollment`: profil **%100 olmadan etkinliğe kayıt açılmaz**.
- `course-demand-client.tsx` — talep, profil olmadan sadece isimle bırakılabilir (`NEW_STUDENT_VALUE`).

Yani sistem tutarlı; **rehber checklist sırası** iki dalı karıştırıyor.

### Ciddiyet

**Orta–kritik (algı).** Veli “kurs talebi bıraktım, neden kayıt olamıyorum?” veya “profil %100 şart mı?” diye takılabilir. Teknik blokaj yok; dokümantasyon netliği eksik.

### Önerilen standart akış

```
A) Veli hesabı + e-posta onayı
B) Çocuk hesabı ekle (kullanıcı adını not al)
C) Çocuk profilini mümkün olan en kısa sürede %100 tamamla
   │
   ├─► Yol 1 — Yayınlanmış etkinlik var
   │     → Etkinliğe kaydet (profil %100 zorunlu)
   │     → Ücretliyse PayTR ile öde
   │     → Formları doldur
   │
   └─► Yol 2 — Uygun etkinlik yok
         → Kurs talebi bırak (profil seçilebilir veya sadece isim)
         → Sınıf açılınca profil yoksa aynı isimle profil oluştur → kayıt otomatik eşleşir
D) Sertifika: etkinlik + formlar + profil %100
```

**Metin önerileri:**

- Checklist’i **Yol 1 / Yol 2** alt dallarına ayır (kısa özet zaten 5a/5b/5c kullanıyor — checklist de aynı yapıya geçsin).
- Header paragrafına ekle: *“Etkinliğe kayıt için çocuk profilinin tamamlanmış olması gerekir.”*
- §8 cümlesini netleştir: *“Etkinliğe kayıt ve sertifika için profil %100 zorunludur. Kurs talebi profil olmadan da bırakılabilir; sınıf açıldığında profil tamamlanmalıdır.”*

---

## Öncelik Sıralı Aksiyon Listesi

| Öncelik | Aksiyon | Etki | Efor |
|---------|---------|------|------|
| **1** | Checklist’i Yol 1 / Yol 2 dallarına ayır; profil %100 tekrarını birleştir; §8 + header’a etkinlik/kurs talebi ayrımını yaz | Akış karışıklığını giderir | Düşük |
| **2** | F01–F07 kodlarını veli metinlerinden kaldır; tablo/SSS’yi panel adlarıyla hizala | Okunabilirlik | Orta |
| **3** | SSS’den gövde tekrarı olan ~10 soruyu çıkar; troubleshooting odaklı 8–10 soruya indir | Sayfa kısalır, bakım kolaylaşır | Orta |
| **4** | “Kısa özet” bölümünü kaldır veya checklist’ten türet | ~%15 tekrar azalır | Düşük |
| **5** | §2 otomatik doldurma uyarı kutusunu kısalt; SSS’yi “nadir” senaryo olarak bırak | Rehber–kod uyumu | Düşük |
| **6** | (İsteğe bağlı) `child-full-name` input’ta `autoComplete="name"` denemesi | Kalan tarayıcı edge case | Düşük |

---

## Sonuç

Veli rehberi işlevsel ve güncel özellikleri (PayTR, kurum tahsilatı, kurs talebi) kapsıyor. En acil iyileştirme **akış netliği** (Madde 4) ve **iç kod temizliği** (Madde 1); ardından **tekrar azaltma** (Madde 2) ile bakım maliyeti düşer. Madde 3’te asıl sorun kod eksikliği değil, rehberin eski workaround’u fazla vurgulamasıdır.

**Önerilen uygulama sırası:** 1 → 2 → 3 → 4 → 5 → 6

---

## Doğrulama Notları

*Bu bölüm, rapor uygulanmadan önce 22 Ağustos 2026 tarihinde yapılan yeniden inceleme ile eklenmiştir. Kod değişikliği yapılmamıştır.*

---

### Madde 1 — Tekrar yüzdeleri

**Sonuç: Düzeltildi** (orijinal ~%85 kaba tahmindi; aşağıda yeniden hesaplanmış değerler)

**Yöntem:** `parent-guide-content.tsx` içindeki checklist (satır 8–21), kısa özet (489–499) ve SSS (23–119) satırları tek tek karşılaştırıldı. “Birebir” = aynı veya neredeyse aynı eylem ifadesi; “konu örtüşmesi” = aynı konu, farklı ayrıntı/sıra.

#### Checklist ↔ Kısa özet

| Checklist | Satır | Kısa özet | Satır | İlişki |
|-----------|-------|-----------|-------|--------|
| d2p.com.tr | 9 | d2p.com.tr → Hesap Oluştur | 490 | Konu örtüşmesi (özet 9–10’u birleştirir) |
| Hesap Oluştur | 10 | (490 ile birleşik) | 490 | Konu örtüşmesi |
| E-posta onay → Veli Girişi | 11 | E-postayı onayla → Veli Girişi | 491 | **Neredeyse birebir** |
| Çocuk ekle | 12 | Çocuk ekle | 492 | **Neredeyse birebir** |
| Kullanıcı adını not al | 13 | Kullanıcı adını not al | 493 | **Neredeyse birebir** |
| Profil %100 (erken) | 14 | Profili %100 yap | 498 | Konu örtüşmesi (checklist’te daha önce) |
| Etkinliğe kaydet | 15 | 5a) Etkinlik → kaydet | 494 | **Neredeyse birebir** |
| PayTR ödeme | 16 | 5b) PayTR | 495 | **Neredeyse birebir** |
| Kurs talebi | 17 | 5c) Kurs talebi | 496 | **Neredeyse birebir** |
| Formları doldur | 18 | Detay → Formları doldur | 497 | **Neredeyse birebir** |
| F01/F02/F05–F07/F03 detayı | 19 | Tanışma + ön test + Onaylar | 497 | Konu örtüşmesi (özet kod içermez) |
| Profil %100 (son) | 20 | Profili %100 yap | 498 | Konu örtüşmesi (checklist içinde tekrar) |

**Özet satır 499** (`Veli = e-posta | Öğrenci = kullanıcı adı`) checklist’te yok; **§3** tablosunda (208–242) anlatılıyor.

**Hesaplanan oranlar:**

| Metrik | Değer | Not |
|--------|-------|-----|
| Birebir aynı metin | **0 / 12** | Hiçbir satır kopyala-yapıştır aynı değil |
| Neredeyse birebir eylem eşleşmesi | **7 / 12** (%58) veya **7 / 11** (%64, birleştirilmiş 9–10) | Orijinal ~%85 **bu metrikte doğrulanmadı** |
| Konu örtüşmesi (checklist maddesi → özet karşılığı) | **12 / 12** (%100) | Tüm checklist konuları özetin bir yerinde geçiyor |
| Özet adımları → checklist karşılığı | **7 / 7** (%100) | Numaralı özet adımlarının tamamı checklist’te var |

**Sonuç:** Orijinal “~%85 örtüşme” ifadesi **kaba tahmindi**. Konu bazında örtüşme %100’e yakın; **neredeyse birebir metin/eylem örtüşmesi ~%58–64**. Rapordaki ~%85, birleştirilmiş konuları ve sıra farklarını tek sayıda topladığı için **yüksek gösterilmiş**.

#### SSS ↔ Gövde (§1–8)

Toplam **19** SSS maddesi.

| SSS | Satır | Gövde karşılığı | Satır | İlişki |
|-----|-------|-----------------|-------|--------|
| Önce veli mi? | 25–27 | §1 Veli hesabı | 152–161 | Konu örtüşmesi |
| Kullanıcı adı | 30–32 | §2 kullanıcı adı | 196–199 | Konu örtüşmesi |
| E-posta onayı gelmedi | 35–37 | — | — | **Troubleshooting (benzersiz)** |
| Bu e-posta kayıtlı | 40–42 | — | — | **Troubleshooting (benzersiz)** |
| Ad Soyad’da veli e-postası | 45–47 | §2 uyarı kutusu | 201–204 | **Neredeyse birebir** + troubleshooting |
| Çocuk giriş yapabilir mi | 50–52 | §3 tablo | 208–242 | Konu örtüşmesi |
| Birden fazla çocuk | 55–57 | §2 (dolaylı) | 165–205 | Konu örtüşmesi (hafif) |
| Uygun etkinlik yoksa | 60–62 | §6 giriş | 362–365 | **Neredeyse birebir** |
| Kurs talebi profilsiz isim | 65–67 | §6 adımlar | 376–385 | **Neredeyse birebir** |
| Ödeme nasıl | 70–72 | §5 giriş | 264–268 | **Neredeyse birebir** |
| Ödemeyi yarım bıraktım | 75–77 | §5 tablo “yarım kaldı” | 297–305 | Troubleshooting + gövde örtüşmesi |
| Kurum kayıt | 80–82 | §5 kurum paragrafı | 328–330 | **Neredeyse birebir** |
| İptal ve iade | 85–87 | §5 iptal paragrafı | 332–354 | **Neredeyse birebir** (özet) |
| Formları kim doldurmalı | 90–92 | — | — | Hafif benzersiz |
| Formları nerede | 95–97 | §7 “Formlara giden yol” | 401–411 | **Neredeyse birebir** |
| Hangi formlar, sırası | 100–102 | §7 tablo | 427–450 | **Neredeyse birebir** |
| Formları ne zaman | 105–107 | §7 tablo notları | 432–444 | **Neredeyse birebir** |
| Profil telefon | 110–112 | §8 | 464–465 | **Neredeyse birebir** |
| Sertifika ne zaman | 115–117 | §8 | 466–467 | **Neredeyse birebir** |

**Hesaplanan oranlar:**

| Metrik | Değer |
|--------|-------|
| Gövdeyle **neredeyse birebir** tekrar | **10 / 19** (%53) — orijinal %53 **doğrulandı** |
| Konu örtüşmesi (hafif dahil) | **14 / 19** (%74) |
| Birincil troubleshooting (gövdede yok / istisna) | **3–5 / 19** (3, 4, 14; 5 ve 11 kısmen) |

**Sonuç:** “SSS ↔ Gövde ~%53” **doğrulandı**. “Checklist ↔ Kısa özet ~%85” **düzeltildi** → metrik tanımına göre %58–64 (birebir eylem) veya %100 (konu).

---

### Madde 2 — Yol 1 / Yol 2 akış ayrımı

**Sonuç: Doğrulandı — yalnızca rehber metni / dokümantasyon değişikliği; UI veya ürün akışı değişikliği gerektirmez.**

**Kanıt:**

- Öneri, `parent-guide-content.tsx` içindeki `checklist` dizisinin (8–21) ve ilgili paragrafların yeniden yazılmasından ibaret.
- **Kısa özet zaten dallanmış yapıda:** satır 494–496 (`5a / 5b / 5c`) — bu bir UX değişikliği değil, mevcut metin organizasyonu.
- Uygulama tarafında kayıt akışı değişmez:
  - Etkinlik: `/dashboard/children` → `Etkinliğe kaydet` (`children-students-client.tsx`, profil %100 kontrolü `event-enrollment.ts:46–48`)
  - Kurs talebi: `/dashboard/kurs-talebi` (`course-demand-client.tsx`)
- Panelde ayrı menü öğeleri ve butonlar zaten var; sıra veya yeni adım eklenmesi önerilmemiş.

**Netleştirme:** Checklist’i “Yol 1 / Yol 2” diye bölmek **copywriting / bilgi mimarisi** işidir. **Onay gerektiren ürün kararı değildir** — mevcut UI davranışı aynı kalır.

---

### Madde 3 — Form adım sayısı ve “Sertifika onay”

**Sonuç: Düzeltildi** — “Sertifika onay” gerçek bir panel adımıdır; F01–F07 kodlu doldurulabilir form değildir.

**Kod kanıtı:**

| Kaynak | Konum | Bulgu |
|--------|-------|-------|
| Form sihirbazı adımları | `course-application-wizard.tsx:597–617` | 4 wizard adımı: `Tanışma`, `Onaylar`, `Son test`, `Sertifika onay` / `Kayıt tamam` |
| Adım 4 içeriği | `course-application-wizard.tsx:1010–1031` | Sertifika durumu, profil/yoklama koşulları, admin onayı; **form gönderimi değil** |
| Form kodları | `participant-forms.ts:4–8, 61–63` | Veli/öğrenci: **F01, F02, F03, F05, F06, F07**; **F04** = uzman görüş formu, **kapsam dışı** |
| Mevcut rehber tablosu | `parent-guide-content.tsx:447–449` | “4. Sertifika onay” zaten rehberde vardı; rapor önerisi bunu yeni icat etmedi |

**Gerçek yapı:**

```
Wizard adımları (panel UI)          İçerdiği form belgeleri
─────────────────────────          ─────────────────────────
1. Tanışma                         F01 (+ tüm sınıflarda F02 ön test)
2. Onaylar                         F05, F06, F07
3. Son test                        F03 (yalnızca 2–8. sınıf)
4. Sertifika onay / Kayıt tamam    Form değil — durum ekranı (profil %100,
                                   yoklama, admin sertifika onayı)
```

**Önerilen tablo düzeltmesi (Madde 1 rapor önerisi için):**

| Adım | Panel adı | Tür | İçerik |
|------|-----------|-----|--------|
| 1 | Tanışma | Doldurulabilir form | Tanıma formu + ön değerlendirme |
| 2 | Onaylar | Doldurulabilir form | Bilimsel ölçüm, medya, katılım onayları |
| 3 | Son test | Doldurulabilir form | Etkinlik sonrası değerlendirme (2–8. sınıf) |
| 4 | Sertifika onay | **Durum / koşul adımı** (F kodu yok) | Profil, yoklama ve admin onayı tamamlanınca sertifika |

**Sonuç:** 4 satırlık tablo **panel sihirbazıyla uyumlu**; ancak 4. satır **form adımı değil**, sertifika sürecinin **durum/özet ekranı**. Rapordaki sadeleştirilmiş 4 adımlık tabloda bu ayrım açıkça etiketlenmeli; “Sertifika onay” F08 gibi bir kodmuş gibi sunulmamalı.

---

### Doğrulama özeti

| Madde | Sonuç | Kısa not |
|-------|-------|----------|
| 1 — Tekrar yüzdeleri | **Düzeltildi** | %53 SSS↔gövde doğru; %85 checklist↔özet kaba tahmin → gerçek ~%58–64 (eylem) veya %100 (konu) |
| 2 — Yol 1 / Yol 2 | **Doğrulandı** | Sadece rehber metni; UI/akış değişikliği ve ürün onayı gerekmez |
| 3 — Form adım sayısı | **Düzeltildi** | 3 doldurulabilir form adımı + 1 sertifika durum adımı; F04 yok; “Sertifika onay” form kodu değil |
