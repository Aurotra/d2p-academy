import { LegalDocumentLayout } from "@/presentation/components/legal/legal-document-layout";
import { KVKK_TEXT_VERSION } from "@/shared/constants/kvkk";

export const metadata = {
  title: "KVKK Aydınlatma Metni | D2P Academy",
  description: "D2P Academy kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <LegalDocumentLayout
      title="Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni"
      lastUpdated={KVKK_TEXT_VERSION}
    >
      <section>
        <h2>1. Veri Sorumlusunun Kimliği</h2>
        <p>
          ATH Eğitim Teknolojileri Mühendislik Danışmanlık Sanayi ve Ticaret Limited Şirketi
          (&quot;D2P Academy&quot; markası altında faaliyet göstermektedir), 6698 sayılı Kişisel
          Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca veri sorumlusu sıfatıyla aşağıda
          açıklanan kapsamda kişisel verilerinizi işlemektedir.
        </p>
        <p>
          Adres: Teknokent, Kınıklı, Hüseyin Yılmaz Cd. No:67, 20160 Pamukkale/Denizli
          <br />
          MERSİS No: Şu an için beyan edilmemiştir.
        </p>
      </section>

      <section>
        <h2>2. İşlenen Veriler ve Amaçları</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>İletişim ve Kimlik Verileri (Ad, Soyad, Telefon, E-posta):</strong>{" "}
            Başvurularınızı almak, sizinle iletişime geçmek, eğitim planlaması yapmak.
          </li>
          <li>
            <strong>Eğitim ve Profil Verileri (Okul, Sınıf, Deneyim, İlgi Alanları):</strong>{" "}
            Eğitim içeriklerini katılımcı seviyesine göre özelleştirmek, akademik raporlama
            yapmak.
          </li>
          <li>
            <strong>Kurumsal Veriler (Kurum Adı, Yetkili Bilgisi):</strong> B2B iş birlikleri ve
            kurumsal teklif süreçlerini yönetmek.
          </li>
          <li>
            <strong>Veli/Vasi Verileri (18 yaş altı katılımcılar için):</strong> Yasal temsilcinin
            onayını almak ve gerektiğinde iletişim kurmak.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Veri İşlemenin Hukuki Sebebi</h2>
        <p>
          Kişisel verileriniz, KVKK m.5 kapsamında; sunulan eğitim hizmetine ilişkin sözleşmenin
          kurulması ve ifası ile açık rızanıza dayalı olarak işlenmektedir.
        </p>
      </section>

      <section>
        <h2>4. Verilerin Saklanma Süresi</h2>
        <p>
          Kişisel verileriniz, ilgili işlem/hizmet ilişkisinin sona ermesinden itibaren 5 yıl süreyle
          saklanır; bu sürenin sonunda mevzuata uygun şekilde silinir, yok edilir veya anonim hale
          getirilir.
        </p>
      </section>

      <section>
        <h2>5. Verilerin Aktarılması</h2>
        <p>
          Kişisel verileriniz; kanuni yükümlülüklerimizi yerine getirmek amacıyla yetkili kamu
          kurumlarıyla, iş süreçlerimizi yürüten sınırlı çözüm ortaklarımızla (veritabanı ve
          barındırma hizmeti sağlayıcısı Supabase ve Vercel, e-posta gönderim hizmeti Resend gibi)
          paylaşılabilir. Bu hizmet sağlayıcılardan bir kısmı yurt dışında (AB/ABD) faaliyet
          gösterdiğinden, verileriniz KVKK&apos;nın yurt dışına veri aktarımına ilişkin hükümleri
          çerçevesinde yurt dışında da işlenebilir. Verileriniz hiçbir şekilde üçüncü şahıslarla
          ticari amaçla paylaşılmaz.
        </p>
      </section>

      <section>
        <h2>6. Reşit Olmayan Katılımcılar</h2>
        <p>
          18 yaşından küçük katılımcılara ilişkin veriler, veli veya yasal vasinin açık rızası
          alınarak işlenir. Formu bir kurum adına dolduran yetkililer, katılımcılar adına gerekli
          yasal yetkiye sahip olduklarını beyan etmiş sayılır.
        </p>
      </section>

      <section>
        <h2>7. Veri Sahibinin Hakları (KVKK Madde 11)</h2>
        <p>
          Kişisel veri sahibi olarak; verilerinizin işlenip işlenmediğini öğrenme, işlenme amacını
          öğrenme, yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış
          işlenmişse düzeltilmesini isteme, KVKK&apos;da öngörülen şartlarda silinmesini veya yok
          edilmesini isteme ve bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme
          haklarına sahipsiniz. Taleplerinizi info@athmuhendislik.com.tr adresine veya yukarıdaki
          adrese yazılı olarak iletebilirsiniz.
        </p>
      </section>
    </LegalDocumentLayout>
    </div>
  );
}
