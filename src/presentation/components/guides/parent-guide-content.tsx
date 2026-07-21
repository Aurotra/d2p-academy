import Link from "next/link";

import { AuthPortalLink } from "@/presentation/components/auth/auth-portal-link";
import { PARENT_GUIDE_UPDATED } from "@/shared/constants/parent-guide";

const checklist = [
  "d2p.com.tr adresine girin.",
  "Sağ üstten Hesap Oluştur ile veli hesabı açın (ad, e-posta, şifre).",
  "E-postanıza gelen onay linkine tıklayın.",
  "Veli Girişi ile e-posta ve şifrenizle giriş yapın.",
  "Panel → Çocuk hesapları → + Çocuk ekle (ad soyad, doğum tarihi, şifre).",
  "Oluşan kullanıcı adını mutlaka not alın.",
  "Etkinliğe kaydet — ardından hemen Formları doldur sayfasına geçin.",
  "Tanışma → Onaylar → (varsa) Son test adımlarını kayıt günü tamamlayın.",
  "Profili düzenle ile bilgileri %100 yapın (sertifika için zorunlu).",
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
    question: "E-posta onayı gelmedi, ne yapmalıyım?",
    answer:
      "Spam, gereksiz veya promosyon klasörlerine bakın. 10–15 dakika bekleyin. Hâlâ gelmezse farklı bir e-posta deneyin veya info@d2p.com.tr adresine yazın.",
  },
  {
    question: "“Bu e-posta zaten kayıtlı” diyor.",
    answer:
      "Daha önce kayıt olmuşsunuz demektir. Veli Girişi ile giriş yapın; şifrenizi unuttuysanız destek ile iletişime geçin.",
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
      "1) Tanışma (F01 — deneyim ve motivasyon), 2) Onaylar (F05, F06, F07 — özellikle F06 medya izinleri), 3) Gerekirse Son test (5–8. sınıflar), 4) Sertifika onay. Tanışma bitmeden Onaylar açılmaz; kayıttan sonra mümkün olan en kısa sürede tamamlayın.",
  },
  {
    question: "Formları ne zaman doldurmalıyım?",
    answer:
      "Etkinliğe kayıt yaptıktan hemen sonra, aynı gün. Etkinlik başlamadan önce Tanışma ve Onaylar tamamlanmış olmalıdır; aksi halde kayıt süreci yarım kalır ve sertifika için gerekli adımlar ilerlemez.",
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
      <header className="mb-10 border-b border-slate-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
          D2P Academy
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Veli Kayıt Rehberi
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Çocuğunuzun etkinlik kaydı, formları ve sertifikası web sitemiz üzerinden yürütülür.
          Aşağıdaki adımları takip ederek birkaç dakikada kayıt işlemini tamamlayabilirsiniz.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-secondary/20 transition hover:bg-secondary-hover hover:shadow-glow-secondary"
          >
            Hesap Oluştur
          </Link>
          <AuthPortalLink href="/login" kind="parent">
            Veli Girişi
          </AuthPortalLink>
          <AuthPortalLink href="/student-login" kind="student">
            Öğrenci Girişi
          </AuthPortalLink>
        </div>
      </header>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-bold text-amber-950">Hızlı kontrol listesi</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-amber-950">
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <div className="mt-10 space-y-10 text-base leading-8 text-slate-700">
        <section>
          <h2 className="text-xl font-bold text-slate-900">1. Veli hesabı açma</h2>
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
          <h2 className="text-xl font-bold text-slate-900">2. Çocuk hesabı ekleme</h2>
          <p className="mt-3">
            Giriş yaptıktan sonra <strong>Panel → Çocuk hesapları → + Çocuk ekle</strong> yolunu
            izleyin.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Bilgi</th>
                  <th className="px-4 py-3 font-semibold">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Ad Soyad</td>
                  <td className="px-4 py-3">Çocuğun tam adı (en az ad + soyad)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Doğum tarihi</td>
                  <td className="px-4 py-3">Takvimden seçin</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Şifre</td>
                  <td className="px-4 py-3">Çocuğun giriş şifresi (en az 6 karakter)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            <strong>Kullanıcı adı otomatik oluşur:</strong> ad + soyad + doğum yılının son 2 hanesi.
            Örnek: Emre Yılmaz, 2015 doğumlu → <code className="rounded bg-slate-100 px-1.5 py-0.5">emreyılmaz15</code>
          </p>
          <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
            Kayıt sonrası ekranda görünen kullanıcı adını mutlaka bir yere yazın. Çocuğunuz giriş
            yaparken buna ihtiyaç duyacak.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">3. Veli girişi mi, öğrenci girişi mi?</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold" />
                  <th className="px-4 py-3 font-semibold">Veli Girişi</th>
                  <th className="px-4 py-3 font-semibold">Öğrenci Girişi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Kim kullanır?</td>
                  <td className="px-4 py-3">Anne / baba / veli</td>
                  <td className="px-4 py-3">Çocuk (öğrenci)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Neyle girilir?</td>
                  <td className="px-4 py-3">E-posta + şifre</td>
                  <td className="px-4 py-3">Kullanıcı adı + şifre</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Ne yapılır?</td>
                  <td className="px-4 py-3">Çocuk ekleme, kayıt, form, profil</td>
                  <td className="px-4 py-3">Rozet, sertifika, kendi paneli</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Site butonu</td>
                  <td className="px-4 py-3 text-primary">Kırmızı — Veli Girişi</td>
                  <td className="px-4 py-3 text-amber-700">Sarı — Öğrenci Girişi</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">4. Etkinliğe kayıt</h2>
          <p className="mt-3">
            <strong>Panel → Çocuk hesapları</strong> sayfasında çocuğunuzun satırından{" "}
            <strong>Etkinliğe kaydet</strong> ile ilgili etkinliği seçin. Kayıt tamamlandığında
            aynı sayfada çocuğunuzun etkinlik listesinde görünür.
          </p>
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <strong>Önemli:</strong> Etkinliğe kayıt tek başına yeterli değildir. Kayıttan hemen
            sonra aşağıdaki formları doldurmanız gerekir — bunları aramanıza gerek yok, panelden
            doğrudan ulaşırsınız.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">
            5. Formları doldurma (kayıttan hemen sonra)
          </h2>
          <p className="mt-3">
            Formlar veli panelinde, çocuğunuzun etkinlik kaydının içindedir. Ayrı bir site veya
            e-posta linki aramanıza gerek yoktur.
          </p>

          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
            <p className="font-semibold">Formlara giden yol</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 leading-7">
              <li>
                <strong>Veli Girişi</strong> → <strong>Panel</strong>
              </li>
              <li>
                <strong>Çocuk hesapları</strong> (veya üst menüdeki çocuklar bölümü)
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
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Adım</th>
                  <th className="px-4 py-3 font-semibold">Ne var?</th>
                  <th className="px-4 py-3 font-semibold">Not</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">1. Tanışma</td>
                  <td className="px-4 py-3">F01 tanıma formu; 5–8. sınıflarda ön test de bu adımda</td>
                  <td className="px-4 py-3">Kayıttan sonra ilk yapılacak</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">2. Onaylar</td>
                  <td className="px-4 py-3">F05, F06 (medya izinleri), F07 onay metinleri</td>
                  <td className="px-4 py-3">F06&apos;da tüm kalemlerde izin gerekir</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">3. Son test</td>
                  <td className="px-4 py-3">Etkinlik sonrası değerlendirme</td>
                  <td className="px-4 py-3">5–8. sınıflar için; diğer sınıflarda atlanır</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">4. Sertifika onay</td>
                  <td className="px-4 py-3">Sertifika süreci</td>
                  <td className="px-4 py-3">Formlar ve profil tamamlandıktan sonra</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            Üstteki renkli adım butonlarında yeşil = tamamlandı, kırmızı = doldurulmalı. Tanışma
            bitmeden Onaylar açılmaz; sırayı atlamayın.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">6. Profil ve sertifika</h2>
          <p className="mt-3">
            Profili düzenle ile okul, sınıf ve diğer bilgileri tamamlayın.{" "}
            <strong>Profil %100 olmadan sertifika verilemez.</strong> Etkinlik tamamlandıktan sonra
            sertifika oluşturulur ve panelden görüntülenebilir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Sık sorulan sorular</h2>
          <dl className="mt-4 space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <dt className="font-semibold text-slate-900">{item.question}</dt>
                <dd className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Kısa özet (paylaşmak için)</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
            {`D2P Academy kayıt:
1) d2p.com.tr → Hesap Oluştur (veli e-posta + şifre)
2) E-postayı onayla → Veli Girişi
3) Çocuk hesapları → Çocuk ekle (ad, doğum tarihi, şifre)
4) Kullanıcı adını not al (ör. emreyılmaz15)
5) Etkinliğe kaydet → hemen Detay → Formları doldur
6) Tanışma + Onaylar (F05/F06/F07) aynı gün tamamla
7) Profili %100 yap (sertifika için)
Veli = e-posta | Öğrenci = kullanıcı adı ile giriş`}
          </p>
        </section>
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
        Son güncelleme: {PARENT_GUIDE_UPDATED} · Sorularınız için{" "}
        <Link href="/iletisim" className="font-semibold text-document-primary underline">
          iletişim
        </Link>{" "}
        sayfamızı kullanabilirsiniz.
      </footer>
    </article>
  );
}
