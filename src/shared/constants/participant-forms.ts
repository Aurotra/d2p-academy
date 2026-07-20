import type { MediaPermissions } from "@/core/domain/participant-forms";
import { LIKERT_OPTIONS } from "@/shared/constants/profile-options";

/** F04 = uzman görüş formu (kapsam dışı). Öğrenci/veli onayları: F05/F06/F07. */
export const CONSENT_TEXT_VERSIONS = {
  scientific: "F05-V01",
  media: "F06-V01",
  participation: "F07-V01",
} as const;

export interface ConsentDocument {
  code: "F05" | "F06" | "F07";
  formType: "scientific" | "media" | "participation";
  title: string;
  version: string;
  paragraphs: string[];
}

export const CONSENT_DOCUMENTS: ConsentDocument[] = [
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
  {
    code: "F07",
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

export const MEDIA_CONSENT_EXPLANATION =
  "D2P Academy eğitimleri uygulamalı çalışma, proje sunumu ve güvenli kayıt tutma gerektirir. Eğitim sırasında çekilen fotoğraf ve videolar; çocuğunuzun gelişimini belgelemek, eğitim kalitesini izlemek, kurumsal raporlama yapmak ve programın tanıtımında (web sitesi, sosyal medya, basılı materyaller) kullanmak için gereklidir. Bu nedenle F06 kapsamındaki tüm kalemlerde “İzin veriyorum” seçilmesi zorunludur.";

export const MEDIA_CONSENT_BLOCK_MESSAGE =
  "Görsel ve medya izinlerinin tamamına onay vermeden eğitime katılım tamamlanamaz ve kayıt sertifika onayına gönderilemez. Lütfen tüm kalemlerde “İzin veriyorum” seçeneğini işaretleyin.";

export const PARTICIPANT_LIKERT_OPTIONS = LIKERT_OPTIONS;

export interface LikertQuestion {
  id: string;
  label: string;
}

export interface FormOptionGroup {
  id: string;
  label: string;
  options: string[];
  multiple?: boolean;
  allowOther?: boolean;
}

/** F01 Bölüm B */
export const INTAKE_PREVIOUS_EXPERIENCE_FIELDS: FormOptionGroup[] = [
  {
    id: "seen_3d_printer",
    label: "Daha önce 3D yazıcı gördünüz mü?",
    options: ["Evet", "Hayır"],
  },
  {
    id: "used_3d_pen",
    label: "Daha önce 3D kalem kullandınız mı?",
    options: ["Evet", "Hayır"],
  },
  {
    id: "used_digital_design",
    label: "Daha önce herhangi bir dijital tasarım programı kullandınız mı?",
    options: ["Evet", "Hayır"],
  },
  {
    id: "past_events",
    label: "Daha önce aşağıdaki etkinliklerden hangilerine katıldınız?",
    options: [
      "Teknofest",
      "Robotik Kodlama Eğitimi",
      "STEM Atölyesi",
      "Bilim Şenliği",
      "Maker Atölyesi",
      "Bilim Merkezi Etkinlikleri",
      "Hiçbirine katılmadım",
    ],
    multiple: true,
  },
  {
    id: "teknofest_participation",
    label: "Daha önce Teknofest'e katıldınız mı?",
    options: ["Yarışmacı olarak", "Ziyaretçi olarak", "Hayır"],
  },
];

/** F01 Bölüm C */
export const INTAKE_TECH_ACCESS_FIELDS: FormOptionGroup[] = [
  {
    id: "has_computer_tablet",
    label: "Evinizde bilgisayar/tablet bulunuyor mu?",
    options: ["Evet", "Hayır"],
  },
  {
    id: "has_internet",
    label: "Evinizde internet erişimi bulunuyor mu?",
    options: ["Evet", "Hayır"],
  },
];

/** F01 Bölüm D */
export const INTAKE_INTEREST_FIELDS: FormOptionGroup[] = [
  {
    id: "interest_areas",
    label: "En çok ilgi duyduğunuz alan hangisidir?",
    options: [
      "Tasarım",
      "Teknoloji",
      "Bilim",
      "Mühendislik",
      "Yazılım",
      "Robotik",
      "Sanat",
      "Henüz karar vermedim",
    ],
    multiple: true,
  },
  {
    id: "career_areas",
    label: "Gelecekte çalışmak isteyebileceğiniz alanlar hangileridir?",
    options: [
      "Mühendislik",
      "Yazılım",
      "Tasarım",
      "Mimarlık",
      "Sağlık",
      "Eğitim",
      "Bilimsel Araştırma",
      "Henüz karar vermedim",
    ],
    multiple: true,
  },
];

/** F01 Bölüm E — katılma nedenleri */
export const INTAKE_MOTIVATION_REASONS = [
  "Yeni şeyler öğrenmek istiyorum",
  "3D yazıcıları merak ediyorum",
  "Tasarım yapmayı seviyorum",
  "Teknoloji ilgimi çekiyor",
  "Kendi ürünlerimi tasarlamak istiyorum",
  "Teknofest projeleri geliştirmek istiyorum",
  "Öğretmenim önerdi",
  "Ailem önerdi",
  "Arkadaşlarım katılıyor",
  "Diğer",
] as const;

/** F01 Bölüm E — 8 Likert */
export const INTAKE_LIKERT_QUESTIONS: LikertQuestion[] = [
  { id: "a", label: "Yeni teknolojileri öğrenmek hoşuma gider." },
  { id: "b", label: "Bir şeyler tasarlamayı severim." },
  { id: "c", label: "Problemlere çözüm üretmekten hoşlanırım." },
  { id: "d", label: "Bilim ve teknoloji ile ilgili etkinliklere katılmayı severim." },
  { id: "e", label: "Gelecekte teknoloji alanında çalışmak isterim." },
  { id: "f", label: "Kendi ürünümü tasarlamak isterim." },
  { id: "g", label: "Takım çalışması yapmayı severim." },
  { id: "h", label: "Yeni fikirler üretmeyi severim." },
];

export const INTAKE_OPEN_ENDED = {
  learn_most: "Bu eğitimde en çok neyi öğrenmek istiyorsunuz?",
  design_wish: "Bir şey tasarlayıp üretebilseydiniz ne yapmak isterdiniz?",
  expectation: "D2P Discovery eğitiminden beklentiniz nedir?",
} as const;

export const PRE_TEST_OPEN_ENDED =
  "Bu eğitim başlamadan önce, tasarım ve üretim teknolojileri hakkında düşündüğünüz en önemli şey nedir?";

const DIMENSION_TITLES = [
  "Problem ve İhtiyaç Farkındalığı",
  "Tasarım Düşüncesi",
  "Üretim ve Teknoloji Farkındalığı",
  "Tasarım ve Üretim Öz Yeterliği",
  "Proje ve Takım Çalışması Eğilimi",
] as const;

/** F02 / F03 ortak 30 madde */
export const TPS_SURVEY_DIMENSIONS: Array<{
  key: "dimension_1" | "dimension_2" | "dimension_3" | "dimension_4" | "dimension_5";
  title: string;
  questions: LikertQuestion[];
}> = [
  {
    key: "dimension_1",
    title: DIMENSION_TITLES[0],
    questions: [
      { id: "d1_a", label: "Günlük hayatta karşılaştığım sorunları fark ederim." },
      { id: "d1_b", label: "Bir ürünün hangi problemi çözdüğünü düşünürüm." },
      { id: "d1_c", label: "Kullanışsız bulduğum ürünleri geliştirmek isterim." },
      { id: "d1_d", label: "İnsanların ihtiyaçlarını anlamaya çalışırım." },
      { id: "d1_e", label: "Çevremdeki eksiklikleri fark ederim." },
      { id: "d1_f", label: "İnsanların işini kolaylaştıracak fikirler düşünürüm." },
    ],
  },
  {
    key: "dimension_2",
    title: DIMENSION_TITLES[1],
    questions: [
      { id: "d2_a", label: "Yeni fikirler üretmeyi severim." },
      { id: "d2_b", label: "Bir probleme birden fazla çözüm düşünebilirim." },
      { id: "d2_c", label: "Hayal ettiğim şeyleri çizmeyi veya modellemeyi severim." },
      { id: "d2_d", label: "Yeni ürünler tasarlamak ilgimi çeker." },
      { id: "d2_e", label: "Tasarım yaparken yaratıcı olduğumu düşünürüm." },
      { id: "d2_f", label: "Bir ürünü daha kullanışlı hale getirebilirim." },
    ],
  },
  {
    key: "dimension_3",
    title: DIMENSION_TITLES[2],
    questions: [
      { id: "d3_a", label: "Ürünlerin nasıl üretildiğini merak ederim." },
      { id: "d3_b", label: "Yeni üretim teknolojileri ilgimi çeker." },
      { id: "d3_c", label: "Bir tasarımın ürüne dönüşmesi beni heyecanlandırır." },
      { id: "d3_d", label: "Dijital tasarım araçlarını öğrenmek isterim." },
      { id: "d3_e", label: "3D yazıcı teknolojileri ilgimi çekmektedir." },
      { id: "d3_f", label: "Dijital üretim gelecekte daha önemli olacaktır." },
    ],
  },
  {
    key: "dimension_4",
    title: DIMENSION_TITLES[3],
    questions: [
      { id: "d4_a", label: "Basit bir ürün tasarlayabileceğime inanıyorum." },
      { id: "d4_b", label: "Yeni teknolojileri öğrenebilirim." },
      { id: "d4_c", label: "Yeni şeyler üretmeyi başarabilirim." },
      { id: "d4_d", label: "Bir fikrimi ürüne dönüştürebilirim." },
      { id: "d4_e", label: "Karşılaştığım problemlere çözüm üretebilirim." },
      { id: "d4_f", label: "Bir proje içerisinde görev alabilirim." },
    ],
  },
  {
    key: "dimension_5",
    title: DIMENSION_TITLES[4],
    questions: [
      { id: "d5_a", label: "Takım halinde çalışmayı severim." },
      { id: "d5_b", label: "Arkadaşlarımla fikir alışverişi yapabilirim." },
      { id: "d5_c", label: "Bir proje için sorumluluk alabilirim." },
      { id: "d5_d", label: "Grup çalışmalarına katkı sağlayabilirim." },
      { id: "d5_e", label: "Başkalarının fikirlerine saygı duyarım." },
      { id: "d5_f", label: "Ortak bir hedef için çalışabilirim." },
    ],
  },
];

/** F03 Bölüm B */
export const TRAINING_IMPACT_QUESTIONS: LikertQuestion[] = [
  { id: "ti_a", label: "Eğitim beklentilerimi karşıladı." },
  { id: "ti_b", label: "Eğitim boyunca aktif olarak katılım sağladım." },
  { id: "ti_c", label: "Takım çalışmaları benim için faydalı oldu." },
  { id: "ti_d", label: "3D kalem uygulamalarını faydalı buldum." },
  { id: "ti_e", label: "Dijital tasarım etkinliklerini faydalı buldum." },
  { id: "ti_f", label: "3D yazıcı teknolojileri hakkında bilgi sahibi oldum." },
  { id: "ti_g", label: "Tasarım ve üretim süreçlerini daha iyi anladım." },
  { id: "ti_h", label: "Problem çözme konusunda kendime daha fazla güveniyorum." },
  { id: "ti_i", label: "Kendi ürünümü tasarlamak istiyorum." },
  { id: "ti_j", label: "Yeni teknolojiler öğrenmeye devam etmek istiyorum." },
];

/** F03 Bölüm C */
export const FUTURE_TRENDS_QUESTIONS: LikertQuestion[] = [
  { id: "ft_a", label: "D2P Academy'nin diğer eğitimlerine katılmak isterim." },
  { id: "ft_b", label: "Gelecekte Teknofest projelerinde yer almak isterim." },
  { id: "ft_c", label: "Gelecekte mühendislik veya teknoloji alanında çalışmak isterim." },
  { id: "ft_d", label: "Tasarım yapmaya devam etmek istiyorum." },
  { id: "ft_e", label: "3D yazıcı kullanmayı öğrenmek istiyorum." },
  { id: "ft_f", label: "Bu eğitimi arkadaşlarıma tavsiye ederim." },
];

/** F03 Bölüm D */
export const POST_TEST_OPEN_ENDED = {
  favorite_activity: "Bu eğitimde en çok hoşunuza giden etkinlik hangisiydi?",
  most_important_learning: "Bu eğitimde öğrendiğiniz en önemli şey nedir?",
  next_topics: "Bir sonraki D2P eğitiminde hangi konuları görmek isterdiniz?",
  product_idea: "Bugün tasarlayabileceğinizi düşündüğünüz bir ürün fikri yazınız.",
} as const;

/** Geriye dönük import uyumu */
export const PRE_TEST_DIMENSIONS = Object.fromEntries(
  TPS_SURVEY_DIMENSIONS.map((dimension) => [dimension.key, dimension.questions]),
) as Record<string, LikertQuestion[]>;

export const POST_TEST_DIMENSIONS = PRE_TEST_DIMENSIONS;
