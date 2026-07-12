import { LegalDocumentLayout } from "@/presentation/components/legal/legal-document-layout";
import { KVKK_TEXT_VERSION } from "@/shared/constants/kvkk";

export const metadata = {
  title: "Gizlilik Politikası | D2P Academy",
  description: "D2P Academy web sitesi ve hizmetleri gizlilik politikası.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <LegalDocumentLayout title="Gizlilik Politikası" lastUpdated={KVKK_TEXT_VERSION}>
      <section>
        <h2>1. Giriş</h2>
        <p>
          Bu Gizlilik Politikası; D2P Academy web sitesi, öğrenci paneli, ön kayıt formları,
          kurumsal talep formları ve dijital hizmetlerimiz kapsamında kişisel verilerinizin nasıl
          toplandığını, kullanıldığını ve korunduğunu açıklar. Veri sorumlusu ATH Eğitim
          Teknolojileri Mühendislik Danışmanlık Sanayi ve Ticaret Limited Şirketi&apos;dir.
        </p>
      </section>

      <section>
        <h2>2. Toplanan Bilgiler</h2>
        <p>Platformumuzda aşağıdaki bilgiler toplanabilir:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Hesap bilgileri (ad, soyad, e-posta)</li>
          <li>Ön kayıt ve iletişim bilgileri (telefon, eğitim düzeyi, atölye tercihi)</li>
          <li>Öğrenci profil bilgileri (okul, deneyim, ilgi alanları, motivasyon cevapları)</li>
          <li>Kurumsal başvuru bilgileri (kurum adı, yetkili, katılımcı sayısı)</li>
          <li>Veli/vasi bilgileri (18 yaş altı katılımcılar için)</li>
          <li>Teknik veriler (IP adresi, tarayıcı türü, oturum kayıtları)</li>
        </ul>
      </section>

      <section>
        <h2>3. Bilgilerin Kullanım Amaçları</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Eğitim ve atölye hizmetlerinin sunulması</li>
          <li>Başvuru, kayıt ve iletişim süreçlerinin yürütülmesi</li>
          <li>Öğrenci paneli, döküman paylaşımı ve değerlendirme işlemleri</li>
          <li>Sertifika doğrulama ve akademik raporlama</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          <li>Açık rıza verilmesi halinde e-posta ile bilgilendirme</li>
        </ul>
      </section>

      <section>
        <h2>4. Çerezler ve Benzer Teknolojiler</h2>
        <p>
          Web sitemizde oturum yönetimi, güvenlik ve kullanıcı deneyimini iyileştirmek amacıyla
          zorunlu çerezler kullanılabilir. Canlı destek ve barındırma altyapısı gibi hizmet
          sağlayıcılar da kendi çerezlerini kullanabilir. Tarayıcı ayarlarınızdan çerez
          tercihlerinizi yönetebilirsiniz; bazı çerezlerin kapatılması hizmetin tam çalışmamasına
          neden olabilir.
        </p>
      </section>

      <section>
        <h2>5. Veri Aktarımı ve Üçüncü Taraflar</h2>
        <p>
          Kişisel verileriniz; kanuni yükümlülüklerimizi yerine getirmek, bilişim altyapımızı yönetmek
          ve eğitim/danışmanlık faaliyetlerimizi kesintisiz sürdürmek amacıyla, güvenliğini
          taahhüt ettiğimiz, veri gizliliği politikalarıyla uyumlu, alanında yetkin çözüm
          ortaklarımız ve bulut bilişim hizmet sağlayıcılarımız ile paylaşılabilir.
        </p>
        <p>
          Kullandığımız bazı bulut hizmet sağlayıcıları yurt dışında (Avrupa Birliği/Amerika
          Birleşik Devletleri) faaliyet gösterdiğinden, verileriniz KVKK&apos;nın yurt dışına veri
          aktarımına ilişkin hükümleri çerçevesinde yurt dışında da işlenebilir.
        </p>
        <p>
          Verileriniz hiçbir durumda üçüncü şahıslarla ticari amaçla paylaşılmaz ve yalnızca
          hizmetin ifası için gerekli olan sınırlı amaçlarla işlenir. Detaylı bilgi için{" "}
          <a href="/kvkk" className="font-semibold text-document-primary underline">
            Aydınlatma Metni
          </a>
          &apos;ne bakınız.
        </p>
      </section>

      <section>
        <h2>6. Veri Güvenliği</h2>
        <p>
          Kişisel verilerinizin yetkisiz erişime, kayba veya kötüye kullanıma karşı korunması için
          teknik ve idari güvenlik önlemleri uygulanmaktadır. Erişimler rol bazlı yetkilendirme ile
          sınırlandırılır.
        </p>
      </section>

      <section>
        <h2>7. Haklarınız</h2>
        <p>
          KVKK kapsamındaki haklarınız (bilgi talep etme, düzeltme, silme, itiraz vb.) için
          info@athmuhendislik.com.tr adresine başvurabilirsiniz. Başvurularınız mevzuata uygun
          sürelerde yanıtlanır.
        </p>
      </section>

      <section>
        <h2>8. Politika Değişiklikleri</h2>
        <p>
          Bu politika güncellenebilir. Güncel sürüm web sitemizde yayımlanır; önemli değişiklikler
          uygun görüldüğünde kullanıcılara bildirilir.
        </p>
      </section>

      <section>
        <h2>9. İletişim</h2>
        <p>
          ATH Eğitim Teknolojileri Mühendislik Danışmanlık Sanayi ve Ticaret Limited Şirketi
          <br />
          Teknokent, Kınıklı, Hüseyin Yılmaz Cd. No:67, 20160 Pamukkale/Denizli
          <br />
          MERSİS No: 0101125115300001
          <br />
          E-posta: info@athmuhendislik.com.tr
        </p>
      </section>
    </LegalDocumentLayout>
    </div>
  );
}
