import { LegalDocumentLayout } from "@/presentation/components/legal/legal-document-layout";
import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { COMPANY, LEGAL_PATHS } from "@/shared/constants/company";
import { CONTACT } from "@/shared/constants/contact";
import { KVKK_TEXT_VERSION } from "@/shared/constants/kvkk";
import { distanceSalesPageMetadata } from "@/shared/seo/public-pages";

export const metadata = distanceSalesPageMetadata;

interface DistanceSalesPageProps {
  searchParams: Promise<{
    kurs?: string;
    tarih?: string;
    bedel?: string;
    alici?: string;
  }>;
}

function displayOrPlaceholder(value: string | undefined, placeholder: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : placeholder;
}

export default async function DistanceSalesPage({ searchParams }: DistanceSalesPageProps) {
  const query = await searchParams;
  const courseName = displayOrPlaceholder(query.kurs, "[Kurs / Etkinlik Adı]");
  const courseDate = displayOrPlaceholder(query.tarih, "[Eğitim / Etkinlik Tarihi]");
  const coursePrice = displayOrPlaceholder(query.bedel, "[Ücret (TL)]");
  const buyerName = displayOrPlaceholder(query.alici, "[Alıcı Adı Soyadı]");

  return (
    <PublicPageShell>
      <LegalDocumentLayout title="Mesafeli Satış Sözleşmesi" lastUpdated={KVKK_TEXT_VERSION}>
        <section>
          <h2>1. Taraflar</h2>
          <p>
            <strong>Satıcı:</strong> {COMPANY.legalName}
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
          <p>
            <strong>Alıcı:</strong> {buyerName}
            <br />
            Alıcı, {COMPANY.brandDomain} üzerinden elektronik ortamda sipariş/kayıt veren gerçek
            veya tüzel kişidir. Ödeme sırasında beyan edilen iletişim bilgileri alıcıya aittir.
          </p>
        </section>

        <section>
          <h2>2. Sözleşmenin Konusu</h2>
          <p>
            İşbu sözleşmenin konusu; Alıcı&apos;nın Satıcı&apos;ya ait{" "}
            {COMPANY.brandDomain} internet sitesinden elektronik ortamda siparişini verdiği
            aşağıda nitelikleri ve satış fiyatı belirtilen eğitim/etkinlik hizmetinin satışı ve
            ifasına ilişkin 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
            Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin
            belirlenmesidir.
          </p>
        </section>

        <section>
          <h2>3. Hizmet Bilgileri</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Hizmet / Kurs adı:</strong> {courseName}
            </li>
            <li>
              <strong>Tarih / dönem:</strong> {courseDate}
            </li>
            <li>
              <strong>Bedel (KDV dâhil):</strong> {coursePrice}
            </li>
            <li>
              <strong>Ödeme yöntemi:</strong> iyzico güvenli ödeme altyapısı (kredi/banka kartı)
            </li>
          </ul>
          <p className="text-sm text-subtle">
            Ödeme ekranında görünen kurs adı, tarih ve tutar; işbu sözleşmedeki hizmet
            bilgisinin esasını oluşturur. URL parametreleri bilgilendirme amaçlıdır.
          </p>
        </section>

        <section>
          <h2>4. Hizmetin İfası</h2>
          <p>
            Ödemenin onaylanmasıyla Alıcı&apos;ya (veya adına kayıt yapılan katılımcıya) katılım
            hakkı tanımlanır; onay bildirimi e-posta ile iletilir. Fiziki etkinliklerde ifa,
            programın belirtilen yer ve zamanda gerçekleşmesiyle; online hizmetlerde oturumların
            sunulması ve/veya dijital erişimin açılmasıyla tamamlanır.
          </p>
        </section>

        <section>
          <h2>5. Cayma Hakkı ve İade</h2>
          <p>
            Alıcı; Mesafeli Sözleşmeler Yönetmeliği&apos;nde öngörülen hallerde cayma hakkını
            kullanabilir. Belirli bir tarihte ifası kararlaştırılan eğitim/etkinlik hizmetlerinde,
            ifaya başlanmış olması halinde cayma hakkı istisnaları uygulanabilir. İade ve iptal
            koşullarının ayrıntısı{" "}
            <a
              href={LEGAL_PATHS.deliveryRefund}
              className="font-semibold text-document-primary underline"
            >
              Teslimat ve İade Şartları
            </a>{" "}
            sayfasındadır.
          </p>
        </section>

        <section>
          <h2>6. Ödeme Güvenliği</h2>
          <p>
            Kart bilgileri Satıcı tarafından saklanmaz; ödeme iyzico altyapısında 256-bit SSL ile
            işlenir. Ayrıntılar için{" "}
            <a href={LEGAL_PATHS.privacy} className="font-semibold text-document-primary underline">
              Gizlilik Sözleşmesi ve KVKK
            </a>{" "}
            metnine bakınız.
          </p>
        </section>

        <section>
          <h2>7. Uyuşmazlık Çözümü</h2>
          <p>
            İşbu sözleşmeden doğan uyuşmazlıklarda, Tüketici Hakem Heyetleri ve Tüketici
            Mahkemeleri yetkilidir. Satıcı&apos;nın kayıtlı adresi ve iletişim bilgileri
            yukarıdadır.
          </p>
        </section>

        <section>
          <h2>8. Yürürlük</h2>
          <p>
            Alıcı, site üzerinden ödemeyi tamamlayarak işbu sözleşmenin tüm koşullarını okuduğunu
            ve kabul ettiğini beyan eder. Sözleşme, elektronik ortamda kurulmuş sayılır.
          </p>
        </section>
      </LegalDocumentLayout>
    </PublicPageShell>
  );
}
