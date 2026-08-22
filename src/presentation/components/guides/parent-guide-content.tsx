import Link from "next/link";

import { GuideArticlesGrid } from "@/presentation/components/guides/guide-articles-grid";
import { ParentGuideAuthCtas } from "@/presentation/components/guides/parent-guide-auth-ctas";
import { BRAND_ACCENT_CARD_STYLES, BRAND_SURFACE_CARD } from "@/shared/constants/brand-surfaces";
import { PARENT_GUIDE_UPDATED } from "@/shared/constants/parent-guide";

const checklistCommon = [
  "d2p.com.tr adresine girin.",
  "Sağ üstten Hesap Oluştur ile veli hesabı açın (ad, e-posta, şifre).",
  "E-postanıza gelen onay linkine tıklayın; ardından Veli Girişi yapın.",
  "Panel → Çocuk hesapları → + Çocuk ekle (ad soyad, doğum tarihi, şifre).",
  "Oluşan kullanıcı adını mutlaka not alın.",
  "Çocuk profilini %100 tamamlayın (veli telefon numarası dahil; etkinliğe kayıt ve sertifika için zorunlu).",
] as const;

const checklistYol1 = [
  "Çocuk hesapları → Etkinliğe kaydet.",
  "Ücretliyse PayTR güvenli ödeme ekranında kart ile ödemeyi tamamlayın (ödeme bitmeden formlar açılmaz).",
  "Detay → Formları doldur: Tanışma ve Onaylar aynı gün; Son test etkinlik sonrası (2–8. sınıflar).",
] as const;

const checklistYol2 = [
  "Panel → Kurs talebi ile program ve tarih tercihi bırakın.",
  "Sınıf açıldığında aynı isimle çocuk profili oluşturun veya mevcut profili seçerek talebi eşleştirin.",
] as const;

function buildShareableSummary(): string {
  return [
    "D2P Academy — veli kayıt özeti (d2p.com.tr)",
    "",
    "Ortak adımlar:",
    ...checklistCommon.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Yol 1 — Yayınlanmış etkinlik var:",
    ...checklistYol1.map((item) => `• ${item}`),
    "",
    "Yol 2 — Uygun etkinlik yok:",
    ...checklistYol2.map((item) => `• ${item}`),
    "",
    "Veli girişi = e-posta | Öğrenci girişi = kullanıcı adı",
  ].join("\n");
}

const faqItems = [
  {
    question: "E-posta onayı gelmedi veya onay linki hata verdi, ne yapmalıyım?",
    answer:
      "Önce Spam / Gereksiz klasörüne bakın ve 10–15 dakika bekleyin. Onay linkine tıkladıysanız tekrar Veli Girişi deneyin; hesap onaylanmış olabilir. Link süresi dolmuşsa kayıt formunu tekrar göndermeyin — giriş yapın veya info@d2p.com.tr adresine yazın.",
  },
  {
    question: "“Bu e-posta zaten kayıtlı” diyor.",
    answer:
      "Daha önce kayıt olmuşsunuz demektir. Veli Girişi ile giriş yapın; şifrenizi unuttuysanız destek ile iletişime geçin.",
  },
  {
    question: "Çocuk ekle formunda e-posta adresim görünüyor, normal mi?",
    answer:
      "Nadiren tarayıcı yanlış öneri gösterebilir; Ad Soyad alanının çocuğun gerçek adı olduğundan emin olun (ör. Emre Yılmaz). Veli e-postası bu alana girilmemelidir.",
  },
  {
    question: "Ödemeyi yarım bıraktım / ekranı kapattım, ne olur?",
    answer:
      "Kısa süre kontenjan sizin için tutulur; Panel → Çocuk hesapları veya kayıtlar üzerinden «Ödemeyi tamamla» ile devam edebilirsiniz. Ödeme uzun süre bitmezse e-posta ile hatırlatma gelir; süre dolunca yer başka kayıt için açılır — yeniden kayıt deneyebilirsiniz.",
  },
  {
    question: "Formları kim doldurmalı?",
    answer:
      "18 yaş altı çocuklar için formları veli adına doldurmanız yeterlidir. Onay adımında kendi adınızı imza olarak yazarsınız.",
  },
] as const;

export function ParentGuideContent() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header
        className={`mb-10 rounded-[1.75rem] border p-6 sm:p-8 ${BRAND_ACCENT_CARD_STYLES.document}`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
          D2P Academy
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-navy-950 sm:text-4xl">
          Veli Kayıt Rehberi
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Çocuğunuzun etkinlik kaydı, ödeme, kurs talebi, formları ve sertifikası web sitemiz
          üzerinden yürütülür. Etkinliğe kayıt için çocuk profilinin tamamlanmış (%100) olması
          gerekir. Yayınlanmış bir etkinlik varsa kayıt olabilir; uygun tarih yoksa kurs talebi
          bırakabilirsiniz.
        </p>
        <ParentGuideAuthCtas />
      </header>

      <section className={`rounded-2xl border p-6 ${BRAND_ACCENT_CARD_STYLES.accent}`}>
        <h2 className="text-lg font-bold text-navy-950">Hızlı kontrol listesi</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-[var(--text-on-surface-soft)]">
          {checklistCommon.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <div className="mt-5">
          <p className="text-sm font-semibold text-navy-950">Yol 1 — Yayınlanmış etkinlik var</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-7 text-[var(--text-on-surface-soft)]">
            {checklistYol1.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <div className="mt-5">
          <p className="text-sm font-semibold text-navy-950">Yol 2 — Uygun etkinlik yok</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-7 text-[var(--text-on-surface-soft)]">
            {checklistYol2.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mt-10 space-y-10 text-base leading-8 text-[var(--text-on-surface-soft)]">
        <section>
          <h2 className="text-xl font-bold text-navy-950">1. Veli hesabı açma</h2>
          <p className="mt-3">
            <strong>Hesap Oluştur</strong> sayfasından adınızı, e-postanızı ve şifrenizi (en az 6
            karakter) girin. Kayıttan sonra e-postanıza onay maili gelir; linke tıklamadan giriş
            yapamazsınız.
          </p>
          <p className="mt-3">
            <strong>Veli girişi = e-posta + şifre.</strong> Sarı &quot;Öğrenci Girişi&quot; butonu
            çocuğun hesabı içindir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy-950">2. Çocuk hesabı ekleme</h2>
          <p className="mt-3">
            Giriş yaptıktan sonra <strong>Panel → Çocuk hesapları → + Çocuk ekle</strong> yolunu
            izleyin.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border-surface">
            <table className="min-w-[32rem] w-full text-left text-sm">
              <thead className="bg-surface-section text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Bilgi</th>
                  <th className="px-4 py-3 font-semibold">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-surface">
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">Ad Soyad</td>
                  <td className="px-4 py-3">
                    Çocuğun tam adı (en az ad + soyad). Veli e-postası değil.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">Doğum tarihi</td>
                  <td className="px-4 py-3">Takvimden seçin</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">Şifre</td>
                  <td className="px-4 py-3">Çocuğun giriş şifresi (en az 6 karakter)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            <strong>Kullanıcı adı otomatik oluşur:</strong> ad + soyad + doğum yılının son 2 hanesi.
            Örnek: Emre Yılmaz, 2015 doğumlu →{" "}
            <code className="rounded bg-surface-section px-1.5 py-0.5">emreyılmaz15</code>
          </p>
          <p className="mt-3 rounded-xl border border-border-surface bg-surface-tint-yellow px-4 py-3 text-sm text-navy-950">
            Kayıt sonrası ekranda görünen kullanıcı adını mutlaka bir yere yazın; çocuğunuz öğrenci
            girişinde buna ihtiyaç duyacak.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy-950">3. Veli girişi mi, öğrenci girişi mi?</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border-surface">
            <table className="min-w-[32rem] w-full text-left text-sm">
              <thead className="bg-surface-section text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold" />
                  <th className="px-4 py-3 font-semibold">Veli Girişi</th>
                  <th className="px-4 py-3 font-semibold">Öğrenci Girişi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-surface">
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">Kim kullanır?</td>
                  <td className="px-4 py-3">Anne / baba / veli</td>
                  <td className="px-4 py-3">Çocuk (öğrenci)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">Neyle girilir?</td>
                  <td className="px-4 py-3">E-posta + şifre</td>
                  <td className="px-4 py-3">Kullanıcı adı + şifre</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">Ne yapılır?</td>
                  <td className="px-4 py-3">Çocuk ekleme, kayıt, ödeme, kurs talebi, form, profil</td>
                  <td className="px-4 py-3">Rozet, sertifika, kendi paneli</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">Site butonu</td>
                  <td className="px-4 py-3 text-primary">Kırmızı — Veli Girişi</td>
                  <td className="px-4 py-3 text-amber-700">Sarı — Öğrenci Girişi</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy-950">4. Etkinliğe kayıt</h2>
          <p className="mt-3">
            <Link href="/etkinlikler" className="font-semibold text-document-primary hover:underline">
              Etkinlikler
            </Link>{" "}
            sayfasında yayınlanmış atölyeleri görebilirsiniz. Kayıt için{" "}
            <strong>Panel → Çocuk hesapları</strong> sayfasında çocuğunuzun satırından{" "}
            <strong>Etkinliğe kaydet</strong> ile ilgili etkinliği seçin. Kayıt tamamlandığında
            Detay bölümünde çocuğunuzun etkinlik listesinde görünür.
          </p>
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <strong>Önemli:</strong> Ücretli etkinlikte önce ödemeyi tamamlayın; ardından formları
            doldurun. Formlar ayrı bir sitede değildir — panelden doğrudan ulaşırsınız.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy-950">5. Ödeme süreçleri</h2>
          <p className="mt-3">
            Ücretli etkinliklerde kayıt adımından sonra{" "}
            <strong>PayTR</strong> güvenli ödeme ekranı açılır. Ödeme kredi veya banka kartı ile
            yapılır; kartınız uygunsa taksit seçenekleri aynı formda görünür. Kart bilgileriniz D2P
            sunucularında saklanmaz.
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-border-surface">
            <table className="min-w-[32rem] w-full text-left text-sm">
              <thead className="bg-surface-section text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 font-semibold">Ne anlama gelir?</th>
                  <th className="px-4 py-3 font-semibold">Ne yapmalısınız?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-surface">
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">Ödeme bekleniyor</td>
                  <td className="px-4 py-3">
                    Yer sizin için tutuluyor; ödeme henüz tamamlanmadı
                  </td>
                  <td className="px-4 py-3">
                    Panelden <strong>Ödemeyi tamamla</strong> ile PayTR ekranına dönün
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">Ödeme başarılı</td>
                  <td className="px-4 py-3">Kayıt onaylanır; formlar açılır</td>
                  <td className="px-4 py-3">
                    Detay → <strong>Formları doldur</strong> adımına geçin
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">Ödeme yarım kaldı</td>
                  <td className="px-4 py-3">
                    Ekran kapanmış veya işlem uzun süre bitmemiş olabilir
                  </td>
                  <td className="px-4 py-3">
                    Hatırlatma e-postasındaki link veya panelden yeniden deneyin; süre dolunca yer
                    açılır
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-border-surface bg-surface-tint-yellow px-4 py-4 text-sm text-navy-950">
            <p className="font-semibold">Ödeme adımları</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 leading-7">
              <li>
                <strong>Çocuk hesapları</strong> → çocuğunuz için{" "}
                <strong>Etkinliğe kaydet</strong>
              </li>
              <li>Açılan PayTR formunda kart bilgilerinizi girin ve ödemeyi onaylayın</li>
              <li>
                Başarılı ödemeden sonra otomatik yönlendirilirsiniz; formlara panelden devam edin
              </li>
              <li>
                Geçmiş işlemler için <strong>Panel → Ödemelerim</strong>
              </li>
            </ol>
          </div>

          <p className="mt-4">
            <strong>Kurum / okul iş birliği:</strong> Tahsilat kurum üzerinden yapılıyorsa online
            kart ödemesi istenmez. Bu durumda kayıt ve form adımları yine panelden yürür.
          </p>
          <p className="mt-3">
            <strong>İptal ve iade:</strong> Başlangıca 7 gün veya daha fazla kala iptalde ücretin
            tamamı iade edilir; 7 günden az kaldığında iade yerine uygun programa hak devri
            değerlendirilebilir. Onaylanan kart iadeleri PayTR üzerinden, bankanıza göre genellikle
            7–14 iş gününde yansır. Yazılı talep için{" "}
            <a href="mailto:info@d2p.com.tr" className="font-semibold text-document-primary hover:underline">
              info@d2p.com.tr
            </a>
            ; ayrıntılar{" "}
            <Link
              href="/teslimat-ve-iade-sartlari"
              className="font-semibold text-document-primary hover:underline"
            >
              Teslimat ve İade Şartları
            </Link>{" "}
            ve{" "}
            <Link
              href="/mesafeli-satis-sozlesmesi"
              className="font-semibold text-document-primary hover:underline"
            >
              Mesafeli Satış Sözleşmesi
            </Link>{" "}
            sayfalarındadır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy-950">
            6. Kurs talebi (uygun etkinlik yoksa)
          </h2>
          <p className="mt-3">
            Takvimde size uygun etkinlik yoksa <strong>Panel → Kurs talebi</strong> sayfasından
            program ve tercih ettiğiniz tarih aralığını bırakabilirsiniz. Yeterli talep birikince
            D2P Academy sınıf açar; kaydınız veli paneline düşer.
          </p>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            <p className="font-semibold">Kurs talebi adımları</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 leading-7">
              <li>
                <strong>Veli Girişi</strong> → <strong>Panel</strong> →{" "}
                <strong>Kurs talebi</strong>
              </li>
              <li>Program seçin (ör. 3D tasarım, prototipleme)</li>
              <li>
                Mümkünse listeden çocuk profilini seçin; henüz profil yoksa adını yazın ve sonra
                mutlaka Çocuk hesaplarından aynı adla profil oluşturun
              </li>
              <li>Tercih ettiğiniz başlangıç (ve varsa bitiş) tarihini girin</li>
              <li>Talep durumunu aynı sayfadan takip edin</li>
            </ol>
          </div>
          <p className="mt-4 text-sm text-muted">
            Sınıf açıldıktan sonra çocuk profili oluşturduğunuzda, aynı isimle bıraktığınız talep
            otomatik olarak kayda dönüşür. Profil zaten varsa kayıt doğrudan oluşturulur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy-950">
            7. Formları doldurma (ödeme ve kayıttan hemen sonra)
          </h2>
          <p className="mt-3">
            Formlar veli panelinde, çocuğunuzun etkinlik kaydının içindedir. Ayrı bir site veya
            e-posta linki aramanıza gerek yoktur.
          </p>

          <div className="mt-4 rounded-xl border border-border-surface bg-surface-tint-yellow px-4 py-4 text-sm text-navy-950">
            <p className="font-semibold">Formlara giden yol</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 leading-7">
              <li>
                <strong>Veli Girişi</strong> → <strong>Panel</strong>
              </li>
              <li>
                <strong>Çocuk hesapları</strong>
              </li>
              <li>
                Çocuğunuzun satırında <strong>Detay</strong>
              </li>
              <li>
                Etkinlik satırında <strong>Formları doldur →</strong>
              </li>
            </ol>
          </div>

          <p className="mt-4">Açılan sayfada adım adım şu bölümler gelir:</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border-surface">
            <table className="min-w-[32rem] w-full text-left text-sm">
              <thead className="bg-surface-section text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Adım</th>
                  <th className="px-4 py-3 font-semibold">Panelde görünen ad</th>
                  <th className="px-4 py-3 font-semibold">Tür</th>
                  <th className="px-4 py-3 font-semibold">Not</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-surface">
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">1</td>
                  <td className="px-4 py-3">Tanışma</td>
                  <td className="px-4 py-3">Doldurulabilir form</td>
                  <td className="px-4 py-3">
                    Tanıma formu ve tüm sınıf düzeylerinde ön değerlendirme; kayıttan sonra ilk
                    adım
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">2</td>
                  <td className="px-4 py-3">Onaylar</td>
                  <td className="px-4 py-3">Doldurulabilir form</td>
                  <td className="px-4 py-3">
                    Bilimsel ölçüm, medya izinleri ve katılım onayları; medya izinlerinde tüm
                    kalemler gerekir
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">3</td>
                  <td className="px-4 py-3">Son test</td>
                  <td className="px-4 py-3">Doldurulabilir form</td>
                  <td className="px-4 py-3">
                    Yalnızca 2–8. sınıflar; eğitmen yoklamasında zorunlu katılım sağlandığında
                    açılır
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">4</td>
                  <td className="px-4 py-3">Sertifika onay</td>
                  <td className="px-4 py-3">Durum / koşul adımı</td>
                  <td className="px-4 py-3">
                    Doldurulacak form değil; profil, yoklama ve admin onayı tamamlanınca sertifika
                    oluşturulur
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-muted">
            Üstteki renkli adım butonlarında yeşil = tamamlandı, kırmızı = doldurulmalı. Tanışma
            bitmeden Onaylar açılmaz; sırayı atlamayın.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy-950">8. Profil ve sertifika</h2>
          <p className="mt-3">
            <strong>Profili düzenle</strong> ile okul, sınıf, veli telefon numarası ve diğer zorunlu
            bilgileri tamamlayın. Çocuk ekledikten sonra doğrudan profil sayfasına yönlendirilirsiniz.{" "}
            <strong>
              Etkinliğe kayıt ve sertifika için profil %100 zorunludur. Kurs talebi profil olmadan
              da bırakılabilir; sınıf açıldığında profil tamamlanmalıdır.
            </strong>{" "}
            Etkinlik tamamlandıktan sonra sertifika oluşturulur ve panelden görüntülenebilir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy-950">Sık sorulan sorular</h2>
          <dl className="mt-4 space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className={`${BRAND_SURFACE_CARD} p-5`}
              >
                <dt className="font-semibold text-navy-950">{item.question}</dt>
                <dd className="mt-2 text-sm leading-7 text-muted">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${BRAND_SURFACE_CARD} p-6`}>
          <h2 className="text-lg font-bold text-navy-950">Paylaşılabilir özet</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text-on-surface-soft)]">
            {buildShareableSummary()}
          </p>
        </section>
      </div>

      <GuideArticlesGrid className="mt-14 border-t border-border-surface pt-10" />

      <footer className="mt-12 border-t border-border-surface pt-6 text-sm text-subtle">
        Son güncelleme: {PARENT_GUIDE_UPDATED} · Sorularınız için{" "}
        <Link href="/iletisim" className="font-semibold text-document-primary underline">
          iletişim
        </Link>{" "}
        sayfamızı kullanabilirsiniz.
      </footer>
    </article>
  );
}
