import { LegalDocumentLayout } from "@/presentation/components/legal/legal-document-layout";
import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { COMPANY } from "@/shared/constants/company";
import { CONTACT } from "@/shared/constants/contact";
import { KVKK_TEXT_VERSION } from "@/shared/constants/kvkk";
import { deliveryRefundPageMetadata } from "@/shared/seo/public-pages";

export const metadata = deliveryRefundPageMetadata;

export default function DeliveryRefundPage() {
  return (
    <PublicPageShell>
      <LegalDocumentLayout title="Teslimat ve İade Şartları" lastUpdated={KVKK_TEXT_VERSION}>
        <section>
          <h2>1. Satıcı Bilgileri</h2>
          <p>
            {COMPANY.legalName}
            <br />
            Marka: {COMPANY.brandName} ({COMPANY.brandDomain})
            <br />
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
          <h2>2. Hizmet İfası / Teslimat</h2>
          <p>
            Sitemiz üzerinden satılan hizmetler dijital ve/veya fiziki eğitim ile etkinlik
            organizasyonlarından oluşur. Kayıt ve ödemenin tamamlanmasıyla:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Kullanıcıya kayıt onay e-postası gönderilir,</li>
            <li>İlgili öğrenci/katılımcı hesabına katılım hakkı tanımlanır,</li>
            <li>
              Programın niteliğine göre online toplantı bağlantısı, atölye adresi veya katılım
              yönergesi paneller üzerinden paylaşılır.
            </li>
          </ul>
          <p>
            Fiziki etkinliklerde hizmet, programın belirtilen tarih, saat ve lokasyonda
            gerçekleşmesiyle ifa edilmiş sayılır. Online eğitimlerde hizmet, canlı oturumların
            sunulması ve/veya dijital içerik erişiminin açılmasıyla ifa edilir.
          </p>
        </section>

        <section>
          <h2>3. İade ve İptal Kuralları</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Eğitim/etkinlik başlangıç tarihinden <strong>7 gün veya daha fazla</strong> önce
              yapılan iptal taleplerinde ücretin <strong>%100&apos;ü</strong> iade edilir.
            </li>
            <li>
              Başlangıç tarihine <strong>7 günden az</strong> kalan iptal taleplerinde ücret
              iadesi yapılmaz; katılım hakkı bir sonraki uygun programa{" "}
              <strong>hak devri</strong> olarak aktarılabilir (kontenjan uygunluğu ve yazılı onay
              şartıyla).
            </li>
            <li>
              Kurum kaynaklı iptal, erteleme veya programın gerçekleşmemesi halinde ücret{" "}
              <strong>kesintisiz</strong> iade edilir.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. İade Süreci</h2>
          <p>
            İade talepleri {CONTACT.email} adresine yazılı olarak iletilir. Onaylanan iadeler,
            ödemenin alındığı kart üzerinden <strong>iyzico</strong> altyapısı aracılığıyla
            işlenir ve bankanıza göre genellikle <strong>7–14 iş günü</strong> içinde kartınıza
            yansır. Yansıma süresi bankanıza bağlı olarak değişebilir.
          </p>
        </section>

        <section>
          <h2>5. Cayma Hakkı Hakkında</h2>
          <p>
            6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
            kapsamında; belirlenen tarihte ifası başlayan eğitim/etkinlik hizmetlerinde, hizmetin
            ifasına başlanmış olması halinde cayma hakkı istisnaları uygulanabilir. Detaylar için{" "}
            <a
              href="/mesafeli-satis-sozlesmesi"
              className="font-semibold text-document-primary underline"
            >
              Mesafeli Satış Sözleşmesi
            </a>
            &apos;ne bakınız.
          </p>
        </section>

        <section>
          <h2>6. İletişim</h2>
          <p>
            Talepleriniz için: {CONTACT.email} · {CONTACT.phoneDisplay}
            <br />
            {COMPANY.addressFull}
          </p>
        </section>
      </LegalDocumentLayout>
    </PublicPageShell>
  );
}
