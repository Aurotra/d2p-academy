export type GuideBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; title: string; paragraphs: string[] }
  | {
      type: "galleryFigure";
      albumSlug: string;
      /** 0-based index in album photo sort order. */
      photoIndex?: number;
      /** Prefer album cover photo when set (overrides photoIndex). */
      preferCover?: boolean;
    };

export interface GuideArticle {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  /** Simple placeholder body — used when `blocks` is absent. */
  paragraphs?: string[];
  /** Rich article body (headings, lists, callouts, gallery figures). */
  blocks?: GuideBlock[];
}

/**
 * Static guide articles for /rehber.
 * Add new entries here; each slug gets a page via /rehber/[slug].
 * Sitemap picks these up automatically via GUIDE_ARTICLES.
 */
export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "denizli-cocuklar-icin-3d-tasarim-egitimi",
    title: "Denizli'de Çocuklar İçin 3D Tasarım Eğitimi: Neden Şimdiden Başlamalılar?",
    description:
      "Denizli'de çocuklar için 3D tasarım eğitimi neden önemli, hangi yaşta başlanmalı? D2P Academy'nin Honaz ve Kaklık atölyelerinden örneklerle rehber.",
    publishedAt: "2026-08-12",
    blocks: [
      {
        type: "paragraph",
        text: "Teknolojinin hızla geliştiği günümüzde çocukların sadece ekran karşısında \"tüketici\" olması yerine, fikirlerini somut nesnelere dönüştüren \"üreticiler\" haline gelmesi kritik bir önem taşıyor. Özellikle Denizli gibi sanayi, üretim ve mühendislik kültürünün güçlü olduğu bir şehirde, çocukları erken yaşta 3D tasarım ve üretim teknolojileriyle tanıştırmak geleceklerine yapılan en somut yatırımlardan biridir.",
      },
      {
        type: "paragraph",
        text: "Peki, D2P (Design to Product) yaklaşımıyla sunduğumuz 3D tasarım eğitimi çocuklara ne kazandırıyor ve süreç nasıl işliyor?",
      },
      {
        type: "heading",
        level: 2,
        text: "Fikirden Ürüne: 3D Tasarım Çocuklara Ne Öğretir?",
      },
      {
        type: "paragraph",
        text: "3D tasarım sadece bilgisayarda üç boyutlu çizim yapmaktan ibaret değildir. Çocuklar bir fikri zihninde canlandırıp ekrana aktarırken ve ardından 3D yazıcıdan çıktısını alırken şu temel becerileri kazanırlar:",
      },
      {
        type: "list",
        items: [
          "**Uzamsal Zeka ve Geometri:** Matematik dersinde soyut kalan hacim, eksen ve boyut kavramları, 3D modelleme esnasında somut birer araca dönüşür.",
          "**Problem Çözme ve Mühendislik Disiplini:** Çizilen bir modelin basılabilirliği, dayanıklılığı ve ölçeklendirilmesi çocuklara analitik düşünme yeteneği katar.",
          "**Tüketimden Üretime Geçiş:** Oyun oynamak için kullanılan bilgisayarlar; kendi oyuncağını, projesini veya prototipini tasarlayan bir üretim merkezine dönüşür.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Neden Denizli'de D2P Eğitimi?",
      },
      {
        type: "paragraph",
        text: "Denizli'de gerçekleştirdiğimiz atölyelerde çocuklara sadece teorik yazılım bilgisi vermiyoruz. ATH Mühendislik altyapısı ve D2P vizyonuyla hazırlanan programlarımızda; çocuklar tasarladıkları ürünlerin FDM ve SLA 3D yazıcılarda nasıl katman katman üretildiğine birebir tanıklık ediyor.",
      },
      {
        type: "paragraph",
        text: "Honaz'dan Kaklık'a kadar Denizli'nin farklı noktalarında düzenlediğimiz atölyelerde gördük ki; doğru araçlar sunulduğunda çocuklar hayallerindeki nesneleri saatler içinde üretebilecek potansiyele sahip.",
      },
      {
        type: "galleryFigure",
        albumSlug: "denizli-honaz-belediyesi-3d-yaz-kursu-egitimimiz",
        // Honaz albümü: 3D kalemle üretilen gözlüğü takan öğrenci (üretici sonuç görseli)
        photoIndex: 5,
      },
      {
        type: "heading",
        level: 2,
        text: "Çocuğunuz 3D Tasarıma Kaç Yaşında Başlamalı?",
      },
      {
        type: "paragraph",
        text: "3D tasarım eğitimine başlamak için en ideal yaş grubu **8-14 yaş** arasıdır. Bu yaş grubundaki çocuklar, blok tabanlı veya sürükle-bırak mantığıyla çalışan 3D arayüzleri çok hızlı kavrar. İlerleyen aşamalarda ise temel teknik çizim ve üretim prensiplerine kolayca adapte olurlar.",
      },
      {
        type: "callout",
        title: "**Çocuğunuzun İlk 3D Yazıcı Deneyimi İçin Hazır Mısınız?**",
        paragraphs: [
          "Denizli'de düzenlediğimiz gelecek atölyeleri ve eğitim takvimimiz hakkında detaylı bilgi almak için [D2P Veli Rehberi](/veli-rehberi) sayfamızı ziyaret edebilir veya [Etkinlikler](/etkinlikler) bölümünden geçmiş atölyelerimizi inceleyebilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "ornek-makale",
    title: "Örnek Rehber Yazısı",
    description:
      "D2P Academy rehber altyapısı için örnek sayfa. Gerçek makale içeriği daha sonra eklenecek.",
    publishedAt: "2026-08-12",
    paragraphs: [
      "Bu sayfa, /rehber içerik altyapısını test etmek için oluşturulmuş bir örnektir.",
      "Asıl makale metinleri onaylandıktan sonra buraya eklenecektir.",
    ],
  },
];

export function getGuideArticleBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((article) => article.slug === slug);
}
