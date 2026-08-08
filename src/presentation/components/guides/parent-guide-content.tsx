import Link from "next/link";

import { ParentGuideAuthCtas } from "@/presentation/components/guides/parent-guide-auth-ctas";
import { BRAND_ACCENT_CARD_STYLES, BRAND_SURFACE_CARD } from "@/shared/constants/brand-surfaces";
import { PARENT_GUIDE_UPDATED } from "@/shared/constants/parent-guide";

const checklist = [
  "d2p.com.tr adresine girin.",
  "Sağ üstten Hesap Oluştur ile veli hesabı açın (ad, e-posta, şifre).",
  "E-postanıza gelen onay linkine tıklayın; ardından Veli Girişi yapın.",
  "Panel → Çocuk hesapları → + Çocuk ekle (ad soyad, doğum tarihi, şifre).",
  "Oluşan kullanıcı adını mutlaka not alın.",
  "Açılan çocuk profili sayfasında bilgileri doldurun (veli telefon numarası dahil, %100 zorunlu).",
  "Yayınlanmış etkinlik varsa: Çocuk hesapları → Etkinliğe kaydet.",
  "Uygun etkinlik yoksa: Panel → Kurs talebi ile program ve tarih tercihi bırakın.",
  "Kayıt oluştuktan hemen sonra Detay → Formları doldur sayfasına geçin.",
  "Tanışma (F01) ve ön test (F02) ile onayları (F05–F07) kayıt öncesi tamamlayın. Son test (F03) yalnızca 2–8. sınıflarda, etkinlik sonrası açılır.",
  "Profili düzenle ile tüm zorunlu alanları %100 yapın (veli telefon numarası dahil; sertifika için zorunlu).",
];

const faqItems = [
  {
    question: "Önce veli mi kayıt olmalıyım, çocuk mu?",
    answer:
      "Önce veli kayıt olur. Ardından veli panelinden her çocuk için ayrı öğrenci hesabı eklenir.",
  },
  {
    question: "Kullanıcı adını ben mi seçiyorum?",
    answer:
      "Hayır. Sistem otomatik oluşturur: ad + soyad + doğum yılının son 2 hanesi (ör. emreyılmaz15). Aynı isim ve yıl varsa sonuna rakam eklenir.",
  },
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
      "Hayır — bu tarayıcının otomatik doldurmasıdır. Ad Soyad alanına çocuğun gerçek adını yazın (ör. Emre Yılmaz). Veli e-postası bu alana girilmemelidir.",
  },
  {
    question: "Çocuğum kendi giriş yapabilir mi?",
    answer:
      "Evet. Öğrenci Girişi ile kullanıcı adı ve şifre kullanır. Kayıt ve form işlemleri için veli hesabı gerekir.",
  },
  {
    question: "Birden fazla çocuğum var.",
    answer:
      "Aynı veli hesabından + Çocuk ekle ile her çocuk için ayrı hesap açabilirsiniz. Her çocuğun kullanıcı adı farklı olur.",
  },
  {
    question: "Uygun etkinlik yoksa ne yapmalıyım?",
    answer:
      "Panel → Kurs talebi sayfasından program (ör. 3D tasarım, prototipleme) ve tercih ettiğiniz tarih aralığını bırakın. Yeterli talep birikince sınıf açılır; kaydınız panele düşer. Talep durumunu aynı sayfadan takip edebilirsiniz.",
  },
  {
    question: "Kurs talebinde çocuk profili seçmeden sadece isim yazdım, sonra ne olur?",
    answer:
      "Sınıf açıldıktan sonra Çocuk hesapları bölümünden aynı adla öğrenci profili oluşturun. Sistem talebi otomatik eşleştirir ve kaydı tamamlar. Mümkünse talep verirken mevcut çocuk profilini seçmek daha hızlıdır.",
  },
  {
    question: "Formları kim doldurmalı?",
    answer:
      "18 yaş altı çocuklar için formları veli adına doldurmanız yeterlidir. Onay adımında kendi adınızı imza olarak yazarsınız.",
  },
  {
    question: "Formları nerede bulurum? Aramam gerekir mi?",
    answer:
      "Hayır. Veli Girişi → Panel → Çocuk hesapları → çocuğunuzun satırında Detay → etkinlik altında Formları doldur bağlantısı vardır. Etkinliğe yeni kayıt olduysanız aynı sayfadan hemen devam edin; formlar ayrı bir menüde gizli değildir.",
  },
  {
    question: "Hangi formlar var, sırası ne?",
    answer:
      "1) Tanışma (F01 + tüm sınıf düzeylerinde ön test F02), 2) Onaylar (F05, F06, F07), 3) Etkinlik sonrası son test (F03 — yalnızca 2–8. sınıflar), 4) Sertifika onay. Tanışma bitmeden Onaylar açılmaz; son test yoklamada «geldi» işaretlendiğinde veya etkinlik bittiğinde açılır.",
  },
  {
    question: "Formları ne zaman doldurmalıyım?",
    answer:
      "Etkinliğe kayıt yaptıktan hemen sonra Tanışma ve Onaylar adımlarını tamamlayın. Son test (F03) etkinlik günü yoklama alındıktan veya etkinlik süresi bittikten sonra açılır.",
  },
  {
    question: "Profilde veli telefon numarası neden isteniyor?",
    answer:
      "Etkinlik ve iletişim süreçlerinde size ulaşabilmek için çocuk profilinde veli telefon numarası zorunludur. Veli hesabınızda kayıtlı telefon varsa alan otomatik dolar; dilediğinizde güncelleyebilirsiniz. Bu alan doldurulmadan profil %100 sayılmaz ve kayıt/sertifika adımları tamamlanamaz.",
  },
  {
    question: "Sertifikayı ne zaman alırız?",
    answer:
      "Etkinlik tamamlandıktan, formlar doldurulduktan ve profil %100 olduktan sonra sertifika oluşturulur. Veli ve öğrenci panelinden görülebilir.",
  },
];

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
          Çocuğunuzun etkinlik kaydı, kurs talebi, formları ve sertifikası web sitemiz üzerinden
          yürütülür. Yayınlanmış bir etkinlik varsa doğrudan kayıt olabilir; uygun tarih yoksa kurs
          talebi bırakabilirsiniz.
        </p>
        <ParentGuideAuthCtas />
      </header>

      <section className={`rounded-2xl border p-6 ${BRAND_ACCENT_CARD_STYLES.accent}`}>
        <h2 className="text-lg font-bold text-navy-950">Hızlı kontrol listesi</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-[var(--text-on-surface-soft)]">
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
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
            Kayıt sonrası ekranda görünen kullanıcı adını mutlaka bir yere yazın. Çocuğunuz giriş
            yaparken buna ihtiyaç duyacak. Tarayıcı Ad Soyad alanına veli e-postanızı otomatik
            yazarsa silip çocuğun adını girin.
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
                  <td className="px-4 py-3">Çocuk ekleme, kayıt, kurs talebi, form, profil</td>
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
            <strong>Önemli:</strong> Etkinliğe kayıt tek başına yeterli değildir. Kayıttan hemen
            sonra aşağıdaki formları doldurmanız gerekir — bunları aramanıza gerek yok, panelden
            doğrudan ulaşırsınız.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy-950">
            5. Kurs talebi (uygun etkinlik yoksa)
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
            6. Formları doldurma (kayıttan hemen sonra)
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
                  <th className="px-4 py-3 font-semibold">Ne var?</th>
                  <th className="px-4 py-3 font-semibold">Not</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-surface">
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">1. Tanışma</td>
                  <td className="px-4 py-3">
                    F01 tanıma formu; tüm sınıf düzeylerinde ön test (F02) de bu adımda
                  </td>
                  <td className="px-4 py-3">Kayıttan sonra ilk yapılacak</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">2. Onaylar</td>
                  <td className="px-4 py-3">F05, F06 (medya izinleri), F07 onay metinleri</td>
                  <td className="px-4 py-3">F06&apos;da tüm kalemlerde izin gerekir</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">3. Son test</td>
                  <td className="px-4 py-3">Etkinlik sonrası değerlendirme (F03)</td>
                  <td className="px-4 py-3">
                    Yalnızca 2–8. sınıflar; eğitmen ders yoklamasında zorunlu katılım sağlandığında
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-navy-950">4. Sertifika onay</td>
                  <td className="px-4 py-3">Sertifika süreci</td>
                  <td className="px-4 py-3">Formlar ve profil tamamlandıktan sonra</td>
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
          <h2 className="text-xl font-bold text-navy-950">7. Profil ve sertifika</h2>
          <p className="mt-3">
            <strong>Profili düzenle</strong> ile okul, sınıf, veli telefon numarası ve diğer zorunlu
            bilgileri tamamlayın. Çocuk ekledikten sonra doğrudan profil sayfasına yönlendirilirsiniz.{" "}
            <strong>Profil %100 olmadan etkinliğe kayıt ve sertifika verilemez.</strong> Etkinlik
            tamamlandıktan sonra sertifika oluşturulur ve panelden görüntülenebilir.
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
          <h2 className="text-lg font-bold text-navy-950">Kısa özet (paylaşmak için)</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text-on-surface-soft)]">
            {`D2P Academy kayıt:
1) d2p.com.tr → Hesap Oluştur (veli e-posta + şifre)
2) E-postayı onayla → Veli Girişi
3) Çocuk hesapları → Çocuk ekle (ad, doğum tarihi, şifre)
4) Kullanıcı adını not al (ör. emreyılmaz15)
5a) Etkinlik varsa → Etkinliğe kaydet
5b) Etkinlik yoksa → Kurs talebi bırak
6) Detay → Formları doldur (Tanışma + ön test + Onaylar aynı gün)
7) Profili %100 yap — veli telefonu dahil (sertifika için)
Veli = e-posta | Öğrenci = kullanıcı adı ile giriş`}
          </p>
        </section>
      </div>

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
