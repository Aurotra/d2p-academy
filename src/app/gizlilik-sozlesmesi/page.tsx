import { LegalDocumentLayout } from "@/presentation/components/legal/legal-document-layout";
import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { COMPANY, LEGAL_PATHS } from "@/shared/constants/company";
import { CONTACT } from "@/shared/constants/contact";
import { KVKK_TEXT_VERSION } from "@/shared/constants/kvkk";
import { privacyContractPageMetadata } from "@/shared/seo/public-pages";

export const metadata = privacyContractPageMetadata;

export default function PrivacyContractPage() {
  return (
    <PublicPageShell>
      <LegalDocumentLayout
        title="Gizlilik Sözleşmesi ve KVKK"
        lastUpdated={KVKK_TEXT_VERSION}
      >
        <section>
          <h2>1. Veri Sorumlusu</h2>
          <p>
            {COMPANY.legalName} (&quot;{COMPANY.brandName}&quot; / {COMPANY.brandDomain}), 6698
            sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca veri sorumlusudur.
          </p>
          <p>
            Adres: {COMPANY.addressFull}
            <br />
            MERSİS No: {COMPANY.mersisNo}
            <br />
            E-posta: {CONTACT.email}
            <br />
            Telefon: {CONTACT.phoneDisplay}
          </p>
        </section>

        <section>
          <h2>2. Toplanan Bilgiler</h2>
          <p>Platformumuzda aşağıdaki bilgiler toplanabilir:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Hesap ve kimlik bilgileri (ad, soyad, e-posta)</li>
            <li>İletişim bilgileri (telefon, adres/ilçe)</li>
            <li>Etkinlik kaydı ve öğrenci profil bilgileri</li>
            <li>Veli/yasal temsilci bilgileri (18 yaş altı katılımcılar için)</li>
            <li>Ödeme işlemi meta verileri (tutar, tarih, işlem durumu — kart verisi hariç)</li>
            <li>Teknik veriler (IP adresi, tarayıcı, oturum kayıtları)</li>
          </ul>
        </section>

        <section>
          <h2>3. Ödeme Güvenliği ve Kredi Kartı Bilgileri</h2>
          <p>
            <strong>Kredi kartı / banka kartı bilgileriniz sitemizde saklanmaz.</strong> Ödeme
            işlemleri, PCI DSS uyumlu <strong>iyzico</strong> ödeme altyapısı üzerinden,{" "}
            <strong>256-bit SSL</strong> şifreleme ile güvenli biçimde gerçekleştirilir. Kart
            numarası, CVV ve son kullanma tarihi gibi hassas veriler yalnızca iyzico&apos;nun
            güvenli ödeme sayfasında işlenir; D2P Academy sunucularına iletilmez.
          </p>
        </section>

        <section>
          <h2>4. Verilerin Kullanım Amaçları</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Eğitim ve etkinlik hizmetlerinin sunulması</li>
            <li>Kayıt, ödeme, faturalama ve iade süreçlerinin yürütülmesi</li>
            <li>Öğrenci paneli, formlar, yoklama ve sertifika işlemleri</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Açık rıza verilmesi halinde bilgilendirme iletişimi</li>
          </ul>
        </section>

        <section>
          <h2>5. Çerez (Cookie) Politikası</h2>
          <p>
            Web sitemizde oturum yönetimi, güvenlik ve temel kullanıcı deneyimi için zorunlu
            çerezler kullanılır. Ödeme sürecinde iyzico kendi güvenli çerezlerini kullanabilir.
            Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz; zorunlu çerezlerin kapatılması
            giriş ve ödeme adımlarının çalışmamasına yol açabilir.
          </p>
        </section>

        <section>
          <h2>6. Veri Aktarımı</h2>
          <p>
            Kişisel verileriniz; hizmetin ifası, ödeme altyapısı (iyzico), barındırma ve yasal
            yükümlülükler kapsamında, gizlilik taahhütleriyle bağlı çözüm ortaklarımızla
            paylaşılabilir. Verileriniz ticari amaçla üçüncü şahıslara satılmaz.
          </p>
          <p>
            Detaylı KVKK aydınlatma metni için{" "}
            <a href={LEGAL_PATHS.kvkk} className="font-semibold text-document-primary underline">
              Aydınlatma Metni
            </a>
            &apos;ne bakınız.
          </p>
        </section>

        <section>
          <h2>7. Veri Güvenliği</h2>
          <p>
            Sitemizde <strong>256-bit SSL</strong> güvenlik sertifikası kullanılmaktadır. Erişimler
            rol bazlı yetkilendirme ile sınırlandırılır; teknik ve idari güvenlik önlemleri
            uygulanır.
          </p>
        </section>

        <section>
          <h2>8. Haklarınız</h2>
          <p>
            KVKK m.11 kapsamındaki haklarınız (öğrenme, düzeltme, silme, itiraz vb.) için{" "}
            {CONTACT.email} adresine başvurabilirsiniz. Başvurularınız mevzuata uygun sürelerde
            yanıtlanır.
          </p>
        </section>

        <section>
          <h2>9. Politika Değişiklikleri</h2>
          <p>
            Bu sözleşme güncellenebilir. Güncel sürüm {COMPANY.brandDomain} üzerinde yayımlanır.
          </p>
        </section>
      </LegalDocumentLayout>
    </PublicPageShell>
  );
}
