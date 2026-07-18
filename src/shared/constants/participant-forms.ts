import type { MediaPermissions } from "@/core/domain/participant-forms";
import { LIKERT_OPTIONS } from "@/shared/constants/profile-options";

export const CONSENT_TEXT_VERSIONS = {
  scientific: "F05-V01",
  media: "F06-V01",
  participation: "F04-V01",
} as const;

export interface ConsentDocument {
  code: "F04" | "F05" | "F06";
  formType: "participation" | "scientific" | "media";
  title: string;
  version: string;
  paragraphs: string[];
}

/** Onay adımında gösterilen tam metinler (sürüm = CONSENT_TEXT_VERSIONS). */
export const CONSENT_DOCUMENTS: ConsentDocument[] = [
  {
    code: "F04",
    formType: "participation",
    title: "Katılım ve Güvenlik Onayı",
    version: CONSENT_TEXT_VERSIONS.participation,
    paragraphs: [
      "Bu form, katılımcının D2P Academy eğitim / atölye programına güvenli ve kurallara uygun şekilde katılımını belgelemek içindir.",
      "Katılımcı (ve 18 yaşından küçükse yasal temsilcisi); eğitim süresince eğitmen ve görevli personelin yönergelerine uyacağını, atölye alanındaki güvenlik kurallarına (makine, 3D yazıcı, kesici aletler, elektrik ve malzeme güvenliği dahil) riayet edeceğini kabul eder.",
      "Eğitim alanına zarar verecek, diğer katılımcıların güvenliğini tehlikeye atacak veya eğitimi bozacak davranışlarda bulunulmayacaktır. Gerekli görüldüğünde D2P Academy, güvenlik gerekçesiyle katılımı geçici veya kalıcı olarak sonlandırabilir.",
      "Sağlık açısından özel bir durum, alerji veya dikkat edilmesi gereken bir husus varsa, bu bilgi eğitimden önce sağlık notu alanında veya görevlilere bildirilecektir. Bildirilmeyen durumlardan doğabilecek sonuçlardan D2P Academy sorumlu tutulamaz.",
      "Bu onayı vererek yukarıdaki katılım ve güvenlik koşullarını okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz.",
    ],
  },
  {
    code: "F05",
    formType: "scientific",
    title: "Bilimsel Ölçüm ve Araştırma Onayı",
    version: CONSENT_TEXT_VERSIONS.scientific,
    paragraphs: [
      "D2P Academy, eğitim etkisini ölçmek ve programı geliştirmek amacıyla katılımcılara ön test / son test ve tanıma formları uygulayabilir.",
      "Toplanan cevaplar; öğrenme kazanımlarının değerlendirilmesi, anonim veya kimliği maskelenmiş istatistiksel analiz, akademik sunum, raporlama ve eğitim kalitesinin iyileştirilmesi amaçlarıyla işlenebilir.",
      "Araştırma / ölçüm verileri, ilgili mevzuat (KVKK dahil) çerçevesinde saklanır; ticari reklam amaçlı üçüncü kişilere satılmaz. Raporlarda mümkün olduğunca toplu / anonim sonuçlar kullanılır.",
      "Katılım gönüllüdür; ancak programa kayıt ve sertifika süreçlerinin bir parçası olarak ilgili formların doldurulması istenebilir. Onay vermemeniz halinde eğitimin bilimsel ölçüm kısmına dahil edilmezsiniz; bu durumun sertifika / tamamlama süreçlerini etkileyebileceğini kabul edersiniz.",
      "Bu onayı vererek bilimsel ölçüm ve değerlendirme amaçlı form uygulamalarını okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz.",
    ],
  },
  {
    code: "F06",
    formType: "media",
    title: "Görsel ve Medya Kullanım Onayı",
    version: CONSENT_TEXT_VERSIONS.media,
    paragraphs: [
      "Eğitim sırasında katılımcının fotoğraf ve/veya videosu çekilebilir. Aşağıdaki izin matrisi, her kullanım alanı için ayrı ayrı açık rıza almayı amaçlar.",
      "İzin verdiğiniz kalemler kapsamında görseller; D2P Academy web sitesi, sosyal medya hesapları, basılı tanıtım materyalleri, bilimsel / akademik sunumlar (anonim kullanım) ve kurum / proje raporlarında kullanılabilir.",
      "İzin vermediğiniz kalemler için ilgili kullanım yapılmaz. İstediğiniz zaman yazılı başvurunuzla izinlerinizi güncellemenizi talep edebilirsiniz; geçmişte yayımlanmış içeriklerin geri alınması teknik olarak her zaman mümkün olmayabilir.",
      "18 yaşından küçük katılımcılar için bu onayı yasal temsilci (veli/vasi) verir. Aşağıya yazılan ad-soyad, dijital imza yerine geçer ve onay zamanı ile birlikte kayıt altına alınır.",
      "Bu metni ve alttaki izin matrisini okuyarak, işaretlediğiniz kalemler için açık rızanızı verdiğinizi beyan edersiniz.",
    ],
  },
];

export const SURVEY_FORM_VERSIONS = {
  pre_test: "F02-V01",
  post_test: "F03-V01",
} as const;

export const MEDIA_PERMISSION_LABELS: Record<keyof MediaPermissions, string> = {
  photo_capture: "Eğitim sırasında fotoğraf çekimi",
  video_capture: "Eğitim sırasında video çekimi",
  website_publish: "D2P Academy web sitesinde paylaşım",
  social_media_publish: "Sosyal medya hesaplarında paylaşım",
  print_materials: "Broşür ve tanıtım materyallerinde kullanım",
  academic_anonymous_use: "Bilimsel sunum ve raporlarda anonim kullanım",
  municipal_reports: "Kurum ve proje raporlarında kullanım",
};

export const EMPTY_MEDIA_PERMISSIONS: MediaPermissions = {
  photo_capture: false,
  video_capture: false,
  website_publish: false,
  social_media_publish: false,
  print_materials: false,
  academic_anonymous_use: false,
  municipal_reports: false,
};

/** Re-export shared 1–5 scale used by profile + participant forms. */
export const PARTICIPANT_LIKERT_OPTIONS = LIKERT_OPTIONS;

export interface LikertQuestion {
  id: string;
  label: string;
}

/** F01 — 8 madde (katılımcı tanıma Likert). */
export const INTAKE_LIKERT_QUESTIONS: LikertQuestion[] = [
  { id: "i1", label: "Teknolojiyle ilgili yeni konular öğrenmekten keyif alırım." },
  { id: "i2", label: "Bir problemi çözmek için farklı yollar denemeyi severim." },
  { id: "i3", label: "Takım çalışmasında fikirlerimi rahatça paylaşırım." },
  { id: "i4", label: "3D tasarım veya baskı hakkında temel bilgim var." },
  { id: "i5", label: "Yeni bir yazılım/araç öğrenirken sabırlı olabilirim." },
  { id: "i6", label: "Gerçek hayattan bir probleme çözüm üretmek isterim." },
  { id: "i7", label: "Eğitim sırasında yardım istemekten çekinmem." },
  { id: "i8", label: "Bu eğitime kendi isteğimle katılıyorum." },
];

/** F02 — 30 madde (5 boyut × 6). */
export const PRE_TEST_DIMENSIONS: Record<string, LikertQuestion[]> = {
  dimension_1: [
    { id: "d1_1", label: "Bir tasarımı adım adım planlayabilirim." },
    { id: "d1_2", label: "Ölçü ve oran kavramlarını temel düzeyde anlarım." },
    { id: "d1_3", label: "Basit bir 3D modeli zihnimde canlandırabilirim." },
    { id: "d1_4", label: "Tasarımda hata yaptığımda düzeltme yolunu ararım." },
    { id: "d1_5", label: "Teknik bir çizimi anlamaya çalışırım." },
    { id: "d1_6", label: "Tasarım sürecinde sabırlı olabilirim." },
  ],
  dimension_2: [
    { id: "d2_1", label: "3D yazıcının ne işe yaradığını biliyorum." },
    { id: "d2_2", label: "Filament / malzeme kavramını duymuşumdur." },
    { id: "d2_3", label: "Bir modelin baskıya hazırlanması gerektiğini bilirim." },
    { id: "d2_4", label: "Baskı sırasında güvenlik kurallarına dikkat ederim." },
    { id: "d2_5", label: "Ürettiğim bir nesneyi test etmek isterim." },
    { id: "d2_6", label: "Üretim sürecindeki adımları sıraya koyabilirim." },
  ],
  dimension_3: [
    { id: "d3_1", label: "Bir problemi net bir cümleyle tanımlayabilirim." },
    { id: "d3_2", label: "Çözüm için birden fazla fikir üretebilirim." },
    { id: "d3_3", label: "Fikirlerimi basit bir çizimle anlatabilirim." },
    { id: "d3_4", label: "En uygun çözümü seçerken gerekçe sunabilirim." },
    { id: "d3_5", label: "Sonucu değerlendirip iyileştirme öneririm." },
    { id: "d3_6", label: "Başarısız denemelerden ders çıkarırım." },
  ],
  dimension_4: [
    { id: "d4_1", label: "Grup içinde görev dağılımı yapabilirim." },
    { id: "d4_2", label: "Arkadaşlarımın fikirlerini dinlerim." },
    { id: "d4_3", label: "Anlaşmazlıkta yapıcı konuşmaya çalışırım." },
    { id: "d4_4", label: "Ortak hedefe katkı vermeye özen gösteririm." },
    { id: "d4_5", label: "Yardım istediğimde net soru sorarım." },
    { id: "d4_6", label: "Başkasına yardım etmekten memnun olurum." },
  ],
  dimension_5: [
    { id: "d5_1", label: "Teknoloji öğrenmeye kendimi hazır hissediyorum." },
    { id: "d5_2", label: "Zorlandığımda pes etmeden devam ederim." },
    { id: "d5_3", label: "Yeni bir araç denemek beni heyecanlandırır." },
    { id: "d5_4", label: "Hata yapmanın öğrenmenin parçası olduğunu düşünürüm." },
    { id: "d5_5", label: "Bu alanda daha ileri gitmek isterim." },
    { id: "d5_6", label: "Öğrendiklerimi başkasına anlatabileceğime inanırım." },
  ],
};

/** F03 — 16 madde (son test boyutları, kısaltılmış). */
export const POST_TEST_DIMENSIONS: Record<string, LikertQuestion[]> = {
  dimension_1: [
    { id: "p1_1", label: "Eğitim sonrası 3D tasarım adımlarını daha iyi anlıyorum." },
    { id: "p1_2", label: "Basit bir modeli daha güvenle tasarlayabilirim." },
    { id: "p1_3", label: "Ölçü ve oran konularında kendimi geliştirdim." },
    { id: "p1_4", label: "Tasarım hatalarını fark edip düzeltebilirim." },
  ],
  dimension_2: [
    { id: "p2_1", label: "3D baskı sürecinin temel adımlarını biliyorum." },
    { id: "p2_2", label: "Baskı güvenliği konusunda bilincim arttı." },
    { id: "p2_3", label: "Ürettiğim modeli test etmenin önemini anladım." },
    { id: "p2_4", label: "Malzeme seçiminin sonucu etkilediğini gördüm." },
  ],
  dimension_3: [
    { id: "p3_1", label: "Gerçek bir probleme çözüm üretme becerim gelişti." },
    { id: "p3_2", label: "Fikirlerimi daha net ifade edebiliyorum." },
    { id: "p3_3", label: "Çözüm seçerken gerekçe sunabiliyorum." },
    { id: "p3_4", label: "Deneme-yanılma ile ilerlemeyi öğrendim." },
  ],
  dimension_4: [
    { id: "p4_1", label: "Takım çalışmasında daha etkili oldum." },
    { id: "p4_2", label: "Arkadaşlarımla iş birliği yapabiliyorum." },
  ],
  dimension_5: [
    { id: "p5_1", label: "Bu alanda öğrenmeye devam etmek istiyorum." },
    { id: "p5_2", label: "Kendime olan güvenim arttı." },
  ],
};
