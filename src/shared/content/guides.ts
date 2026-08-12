export type GuideBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; items: string[] }
  | { type: "orderedList"; items: string[] }
  | { type: "note"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
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
        text: "Honaz ve Kaklık'ta düzenlediğimiz atölyelerde gördük ki; doğru araçlar sunulduğunda çocuklar hayallerindeki nesneleri saatler içinde üretebilecek potansiyele sahip.",
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
    slug: "denizli-cocuklar-icin-stem-egitimi",
    title: "STEM Eğitimi Nedir? Denizli'de Çocuklar İçin STEM Programları",
    description:
      "STEM eğitimi nedir, çocuğunuza ne kazandırır? Denizli'de D2P Academy'nin mühendislik tasarım döngüsü ve sınıf seviyesine göre STEM yaklaşımı.",
    publishedAt: "2026-08-12",
    blocks: [
      {
        type: "paragraph",
        text: "Eğitim dünyasında son yılların en çok konuşulan kavramlarından biri olan **STEM** (Science, Technology, Engineering, Mathematics); fen, teknoloji, mühendislik ve matematik disiplinlerinin birbiriyle entegre şekilde öğretilmesini hedefleyen bütüncül bir yaklaşımı ifade eder.",
      },
      {
        type: "paragraph",
        text: "Klasik eğitim sisteminde bu dersler birbirinden bağımsız kompartımanlar halinde sunulurken; STEM yaklaşımında çocuklara bir teori anlatılır ve ardından *\"Bu teoriyi gerçek hayattaki bir problemi çözmek için nasıl kullanırız?\"* sorusu sorulur. Sanayi, imalat ve teknik altyapısı güçlü olan Denizli'de çocukların bu bakış açısını erken yaşta kazanması, hem akademik hayatlarında hem de geleceğin mesleklerine hazırlanmalarında kritik bir rol oynar.",
      },
      {
        type: "heading",
        level: 2,
        text: "Mühendislik Tasarım Döngüsü: STEM Nasıl Çalışır?",
      },
      {
        type: "paragraph",
        text: "STEM'i sıradan bir kurs veya etkinlikten ayıran temel unsur, çocuklara **\"Mühendislik Tasarım Döngüsü\"** becerisini kazandırmasıdır. D2P bünyesinde yürüttüğümüz STEM odaklı çalışmalarda çocuklar şu 5 adımı bizzat tecrübe ederler:",
      },
      {
        type: "orderedList",
        items: [
          "**Problemi Tanımlama:** *\"Bir köprü en fazla yükü nasıl taşır?\"* veya *\"Bu mekanizma neden takılıyor?\"* gibi gerçek bir mühendislik problemiyle karşılaşırlar.",
          "**Fikir Geliştirme ve Araştırma:** Problemi çözmek için matematiksel oranlar ve fen prensiplerini kullanarak hipotezler kurarlar.",
          "**Prototip Oluşturma:** Zihinlerindeki çözümü çizim ve modelleme araçlarıyla somut bir taslağa dönüştürürler.",
          "**Test Etme ve Hata Bulma (Debugging):** Hazırladıkları prototip ilk denemede çalışmayabilir. Bu aşamada hatanın nereden kaynaklandığını analitik olarak tespit ederler.",
          "**Yeniden İyileştirme:** Hatalarından ders çıkararak tasarımlarını geliştirir ve çalışan nihai sonuca ulaşırlar.",
        ],
      },
      {
        type: "paragraph",
        text: "Bu döngü, çocuğa sadece teknik bir beceri kazandırmaz; aynı zamanda başarısızlıkla karşılaştığında pes etmemeyi, denemeye devam etmeyi ve analitik düşünmeyi öğretir.",
      },
      {
        type: "heading",
        level: 2,
        text: "STEM'in Okul Müfredatı ve Ders Başarısına Katkısı",
      },
      {
        type: "paragraph",
        text: "Pek çok veli STEM çalışmalarının okul derslerinden bağımsız bir hobi olduğunu düşünür. Oysa STEM, doğrudan MEB müfredatındaki Fen Bilimleri ve Matematik konularının somutlaşmış halidir:",
      },
      {
        type: "list",
        items: [
          "**Geometri ve Ölçü Birimleri:** Ders kitabındaki iki boyutlu şekiller ve hacim hesapları, projenin fiziksel parçaları tasarlanırken doğrudan kullanılır.",
          "**Fiziksel Olaylar ve Kuvvet:** Sürtünme kuvveti, basit makineler, denge ve ağırlık merkezi gibi soyut fen konuları, yapılan maket ve mekanizmalarda gözle görünür hale gelir.",
        ],
      },
      {
        type: "paragraph",
        text: "Çocuklar soyut kavramları ezberlemek yerine, bir projeyi hayata geçirirken bu kuralları bizzat kullandıkları için okul derslerindeki kavrayışları ve başarıları da gözle görülür şekilde artar.",
      },
      {
        type: "heading",
        level: 2,
        text: "Hangi Sınıf Seviyesinde Hangi STEM Becerisi Desteklenmeli?",
      },
      {
        type: "paragraph",
        text: "STEM eğitimi her yaş grubunda farklı bir pedagojik yaklaşımla ele alınmalıdır:",
      },
      {
        type: "list",
        items: [
          "**İlkokul Çağı (1. - 4. Sınıf):** Bu dönemde odak noktası merak duygusunu tetiklemek, temel ölçüm kavramlarını öğretmek ve el-göz koordinasyonunu geliştirmektir.",
          "**Ortaokul Çağı (5. - 8. Sınıf):** Çocuğun soyut düşünme yeteneğinin geliştiği bu evrede; analitik problem çözme, teknik çizim mantığı ve sistem analizi ön plana çıkar.",
        ],
      },
      {
        type: "note",
        text: "(Çocuğunuzun yaş grubuna göre 3D tasarım ve üretim süreçlerine nasıl uyum sağlayabileceğini detaylıca incelemek için [Çocuklar İçin 3D Tasarım Eğitimi Veli Rehberi](/veli-rehberi) sayfamıza göz atabilirsiniz.)",
      },
      {
        type: "heading",
        level: 2,
        text: "Denizli'de D2P ile STEM Deneyimi",
      },
      {
        type: "paragraph",
        text: "Denizli genelinde gerçekleştirdiğimiz atölyelerde ve kurumsal eğitim projelerinde, ATH Mühendislik'in teknik birikimini çocukların seviyesine uygun bir metodolojiye dönüştürüyoruz. Amacımız çocuklara sadece hazır kitler montajlatmak değil; sıfırdan düşünen, tasarlayan ve kendi çözümlerini üretebilen geleceğin mühendislerini ve yenilikçilerini yetiştirmektir.",
      },
      {
        type: "galleryFigure",
        albumSlug: "kaklik-d2p-discovery-egitimi",
        // Kaklık albümü: atölye sonrası grup fotoğrafı (1. makaleden farklı görsel)
        photoIndex: 0,
      },
      {
        type: "callout",
        title: "**Çocuğunuzun STEM Dünyasına İlk Adımı Atmasını İster Misiniz?**",
        paragraphs: [
          "Denizli'de düzenlediğimiz güncel STEM atölyeleri ve kontenjan bilgileri için [Atölyelerimiz](/etkinlikler) sayfasını ziyaret edebilir veya kurumsal/okul talepleriniz için [İletişim](/kurumsal-talep) sayfamızdan bizlerle iletişime geçebilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "robotik-kodlama-ile-3d-tasarim-arasindaki-fark",
    title: "Robotik Kodlama ile 3D Tasarım Arasındaki Fark Nedir? Veliler İçin Rehber",
    description:
      "Robotik kodlama mı, 3D tasarım mı? Denizli'de D2P Academy'den velilere iki disiplin arasındaki farkları ve çocuğunuza uygun eğitimi seçme rehberi.",
    publishedAt: "2026-08-12",
    blocks: [
      {
        type: "paragraph",
        text: "Günümüzde teknoloji eğitimi denildiğinde velilerin karşısına en sık çıkan iki kavram **\"Robotik Kodlama\"** ve **\"3D Tasarım\"** oluyor. Çoğu zaman bu iki alan birbiriyle karıştırılmakta veya aynı eğitimin farklı isimleriymiş gibi algılanmaktadır.",
      },
      {
        type: "paragraph",
        text: "Peki, çocuğunuz için hangi eğitim daha uygundur? Robotik kodlama ile 3D tasarım arasındaki temel farklar nelerdir ve bu iki disiplin birbirini nasıl tamamlar? Denizli'de teknoloji odaklı eğitim veren D2P Academy olarak bu soruların yanıtlarını velilerimiz için derledik.",
      },
      {
        type: "heading",
        level: 2,
        text: "1. Odak Noktası: Mantık ve Algoritma mı, Fiziksel Form ve Geometri mi?",
      },
      {
        type: "paragraph",
        text: "İki alan arasındaki en belirgin fark, çocukların zihinsel süreçlerinde odaklandıkları problem türüdür:",
      },
      {
        type: "list",
        items: [
          "**Robotik Kodlama (Sistem Mantığı ve Hareket):** Odak noktası mantık yürütme, algoritmik düşünme ve komut dizileridir. Çocuk, bir sistemin nasıl davranacağını (örn. *\"Çizgiyi takip et\"*, *\"Engeli görünce dur\"*) kod satırları veya blok zincirleriyle belirler. Buradaki temel kazanım, süreç odaklı nedensellik ilişkisi kurmaktır.",
          "**3D Tasarım (Fiziksel Form ve Üretim):** Odak noktası uzamsal zeka, üç boyutlu düşünme, estetik ve geometridir. Çocuk, zihnindeki hayal gücünü bilgisayar ortamında hacmi, eksenleri (X, Y, Z) ve ölçüleri olan fiziksel bir nesneye dönüştürür. Buradaki temel kazanım, fikirden somut ürüne giden üretim disiplinidir.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "2. Kullanılan Araçlar ve Çıktılar",
      },
      {
        type: "paragraph",
        text: "İki disiplinin öğrenme ortamı ve eğitim sonunda ortaya çıkan ürünler de birbirinden tamamen farklıdır:",
      },
      {
        type: "table",
        headers: ["Özellik", "Robotik Kodlama", "3D Tasarım"],
        rows: [
          [
            "**Kullanılan Araçlar**",
            "Sensörler, motorlar, devre kartları, blok kodlama yazılımları",
            "3D modelleme yazılımları, dijital ölçü aletleri, 3D yazıcılar",
          ],
          [
            "**Temel Kazanım**",
            "Problem çözme, algoritmik düşünme, esneklik",
            "Uzamsal düşünme, teknik çizim, fiziksel üretim disiplini",
          ],
          [
            "**Somut Çıktı**",
            "Belirli görevleri yerine getiren çalışan bir mekanizma/sistem",
            "Elde tutulabilir, özgün ve üretilmiş fiziksel bir nesne/prototip",
          ],
        ],
      },
      {
        type: "galleryFigure",
        albumSlug: "denizli-honaz-belediyesi-3d-yaz-kursu-egitimimiz",
        // Honaz albümü: 3D kalemle üretim (1. ve 2. makaleden farklı görsel)
        photoIndex: 3,
      },
      {
        type: "heading",
        level: 2,
        text: "3. Hangisi Çocuğunuz İçin Daha Uygun?",
      },
      {
        type: "paragraph",
        text: "Çocuğunuzun ilgi alanları ve baskın yetenekleri, hangi alana yönelmeniz gerektiği konusunda harika ipuçları verir:",
      },
      {
        type: "list",
        items: [
          "**Çocuğunuz robotik kodlamaya daha yatkın olabilir eğer;** bulmacalara meraklıysa, olayların mantık silsilesine odaklanıyorsa, bilgisayar oyunlarının mekaniklerini merak ediyorsa ve değişken kurallarla oynamayı seviyorsa.",
          "**Çocuğunuz 3D tasarıma daha yatkın olabilir eğer;** resim yapmayı, Legolarla özgün yapılar kurmayı seviyorsa, el becerileri güçlüyse, hayalindeki nesneleri tarif etmekten keyif alıyorsa ve kendi oyuncağını bizzat üretmek istiyorsa.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "İki Alan Birleştiğinde Ne Olur? (Tam STEM Deneyimi)",
      },
      {
        type: "paragraph",
        text: "Robotik kodlama ve 3D tasarım aslında birbirinin rakibi değil, kusursuz tamamlayıcılarıdır.",
      },
      {
        type: "paragraph",
        text: "Sadece hazır robotik kitleri kullanan bir çocuk, kitin izin verdiği kalıpların dışına çıkamaz. Ancak **3D tasarım** bilen bir çocuk; kendi robotunun gövdesini tasarlar, ihtiyaç duyduğu çarkı kendisi çizer ve ardından bunu **kodlayarak** hareket ettirir. İşte bu birleşim, tam anlamıyla gerçek bir mühendislik yaklaşımı yaratır.",
      },
      {
        type: "note",
        text: "(Çocukların STEM odaklı düşünce yapısını ve mühendislik tasarım döngüsünü nasıl kazandığını incelemek için [Denizli'de Çocuklar İçin STEM Programları](/rehber/denizli-cocuklar-icin-stem-egitimi) yazımıza göz atabilirsiniz.)",
      },
      {
        type: "heading",
        level: 2,
        text: "Denizli'de D2P Academy Yaklaşımı",
      },
      {
        type: "paragraph",
        text: "D2P Academy olarak Denizli'de sunduğumuz programlarda, çocukları sadece yazılım tüketen veya hazır parçaları birleştiren bireyler olarak görmüyoruz. ATH Mühendislik vizyonumuzla, çocukların zihnindeki fikirleri 3D tasarım ile somutlaştırıp kendi projelerini üretebilecekleri özgün bir eğitim ortamı sunuyoruz.",
      },
      {
        type: "callout",
        title: "**Çocuğunuzun Yeteneğine Uygun Eğitimi Birlikte Belirleyelim**",
        paragraphs: [
          "Atölye takvimimizi ve eğitim içeriklerimizi incelemek için [Atölyelerimiz](/etkinlikler) sayfasını ziyaret edebilir, aklınıza takılan tüm sorular için [D2P Veli Rehberi](/veli-rehberi) bölümünden bilgi alabilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "honaz-belediyesi-3d-yaz-kursu",
    title: "Honaz Belediyesi 3D Yaz Kursu: Atölyeden Kareler ve Üretim Heyecanı",
    description:
      "Honaz Belediyesi iş birliğiyle Denizli'de düzenlenen 3D tasarım yaz kursundan kareler. D2P Academy'nin uygulamalı atölye deneyimi ve çocukların ürettiği projeler.",
    publishedAt: "2026-08-12",
    blocks: [
      {
        type: "paragraph",
        text: "Denizli'de çocuklarımızı geleceğin üretim teknolojileriyle tanıştırma vizyonumuz doğrultusunda, **Honaz Belediyesi** iş birliğiyle gerçekleştirdiğimiz 3D Tasarım Yaz Kursu'nu başarıyla tamamladık.",
      },
      {
        type: "paragraph",
        text: "Honazlı çocuklarımızın yoğun ilgi gösterdiği atölye boyunca; teorik eğitimlerin ötesine geçerek tamamen uygulamalı, üretime ve hayal gücüne dayalı bir öğrenme süreci yaşadık. Bu yazımızda, Honaz 3D tasarım atölyemizde neler öğrendik, çocuklarımız hangi projeleri üretti ve süreç nasıl işledi sorularının yanıtlarını keyifli karelerle paylaşıyoruz.",
      },
      {
        type: "heading",
        level: 2,
        text: "Atölyede Neler Yapıldı? Fikirden Somut Objeye",
      },
      {
        type: "paragraph",
        text: "Yaz kursumuz süresince öğrencilerimizi sadece yazılım kullanan bireyler değil, zihnindeki fikri fiziksel bir nesneye dönüştürebilen genç tasarımcılar olarak yetiştirmeyi hedefledik. Eğitim programımız 3 temel aşamada gerçekleşti:",
      },
      {
        type: "orderedList",
        items: [
          "**3D Modellemeye İlk Adım:** Öğrencilerimiz, üç boyutlu uzayda X, Y ve Z eksenlerinin mantığını kavrayarak temel geometrik formlarla ilk dijital tasarımlarını çizdiler.",
          "**Ölçü ve Ölçeklendirme:** Kendi anahtarlıklarını, isimliklerini ve mini figürlerini tasarlarken dijital kumpas ve ölçüm prensiplerini bizzat uyguladılar.",
          "**Canlı Katmanlı Üretim Deneyimi:** Tasarladıkları ürünlerin 3D yazıcılarımızda katman katman üretilişini heyecanla izlediler. Ekrandaki çizimin fiziksel bir nesneye dönüşmesi çocukların üretim motivasyonunu en üst seviyeye çıkardı.",
        ],
      },
      {
        type: "galleryFigure",
        albumSlug: "denizli-honaz-belediyesi-3d-yaz-kursu-egitimimiz",
        // Honaz: atölye çalışma anı — bilgisayar başında modelleme (önceki makalelerde kullanılmadı)
        photoIndex: 1,
      },
      {
        type: "heading",
        level: 2,
        text: "Çocuklar İçin Neden Unutulmaz Bir Deneyim Oldu?",
      },
      {
        type: "paragraph",
        text: "Klasik yaz kurslarının aksine, Honaz 3D yaz kursumuzda çocuklar edilgen birer dinleyici olmadı. Kendi oyuncaklarını, proje parçalarını ve günlük hayatta kullanabilecekleri objeleri bizzat çizip ürettiler.",
      },
      {
        type: "paragraph",
        text: "Atölye boyunca çocukların kazandığı en büyük değer, *\"Ben bunu hayal ettim ve ellerimle ürettim\"* özgüveni oldu.",
      },
      {
        type: "galleryFigure",
        albumSlug: "denizli-honaz-belediyesi-3d-yaz-kursu-egitimimiz",
        // Honaz: sınıf/atölye ortamı — üretim heyecanı (önceki makalelerde kullanılmadı)
        photoIndex: 2,
      },
      {
        type: "heading",
        level: 2,
        text: "Yerel Yönetimler ve Kurumsal Atölye Vizyonumuz",
      },
      {
        type: "paragraph",
        text: "D2P Academy olarak, ATH Mühendislik altyapımız ve uzman kadromuzla Denizli'nin her noktasında çocuklarımızı teknoloji ve mühendislik disipliniyle buluşturmayı sürdürüyoruz. Honaz Belediyesi ile gerçekleştirdiğimiz bu başarılı atölye, yerel yönetimler ve okullarla yürütebileceğimiz geleceğin eğitim modellerine harika bir örnek oluşturdu.",
      },
      {
        type: "paragraph",
        text: "Siz de okulunuzda, belediyenizde veya kurumunuzda çocuklara yönelik özgün 3D tasarım ve STEM atölyeleri düzenlemek istiyorsanız bizimle iletişime geçebilirsiniz.",
      },
      {
        type: "callout",
        title: "**Benzer Etkinliklerimizi ve Gelecek Atölyelerimizi İnceleyin**",
        paragraphs: [
          "Denizli genelinde gerçekleştirdiğimiz tüm saha çalışmalarını [Atölye ve Etkinlikler](/etkinlikler) sayfamızdan inceleyebilir, çocuklarda 3D tasarım eğitiminin pedagojik detayları için [Denizli'de Çocuklar İçin 3D Tasarım Eğitimi](/rehber/denizli-cocuklar-icin-3d-tasarim-egitimi) rehberimize göz atabilirsiniz.",
          "Okul veya belediye bazlı toplu atölye talepleriniz için [Kurumsal İletişim](/kurumsal-talep) formumuzu doldurabilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "cocugunuz-icin-ilk-3d-yazici-deneyimi",
    title: "Çocuğunuz İçin İlk 3D Yazıcı Deneyimi: Veliler İçin Kapsamlı Rehber",
    description:
      "Çocuğunuz için ilk 3D yazıcı deneyimi: güvenlik kuralları, doğru filament seçimi ve yaşa uygun yazılımlar. D2P Academy'den velilere kapsamlı rehber.",
    publishedAt: "2026-08-12",
    blocks: [
      {
        type: "paragraph",
        text: "Çocuğunuz ekranda çizdiği veya hayal ettiği bir oyuncağı, kendi odasında fiziksel bir nesneye dönüştürdüğünde yaşadığı heyecan tarif edilemez. 3D yazıcılar, çocukların tüketici olmaktan çıkıp üreten bireyler haline gelmesinde günümüzün en güçlü araçlarından biridir.",
      },
      {
        type: "paragraph",
        text: "Ancak bir veli olarak zihninizde haklı sorular belirebilir: *\"Evde 3D yazıcı kullanmak güvenli mi?\", \"Hangi malzemeleri kullanmalıyız?\", \"Çocuğum bu teknolojiyi tek başına çalıştırabilir mi?\"*",
      },
      {
        type: "paragraph",
        text: "Denizli'de D2P Academy olarak, çocukların ilk 3D yazıcı deneyimini güvenli, verimli ve eğlenceli bir öğrenme yolculuğuna dönüştürmeniz için bilmeniz gereken temel noktaları derledik.",
      },
      {
        type: "heading",
        level: 2,
        text: "1. Güvenlik Her Şeyden Önce Gelir: Ev Ortamında 3D Yazıcı Kullanımı",
      },
      {
        type: "paragraph",
        text: "3D yazıcılar ısı ve hareketli parçalarla çalışan cihazlardır. Çocuğunuzun güvenliği için dikkat etmeniz gereken 3 temel kural vardır:",
      },
      {
        type: "list",
        items: [
          "**Sıcak Uç (Nozul) Farkındalığı:** FDM tipi 3D yazıcıların baskı kafası (nozul) 200°C ve üzeri sıcaklıklara ulaşır. Çocuğunuza baskı esnasında veya baskı biter bitmez bu bölgeye dokunmaması gerektiğini öğretmelisiniz.",
          "**Hareket Eden Parçalar:** Cihaz çalışırken motorlar ve kayışlar hızla hareket eder. El veya yabancı cisimlerin mekanizmaya sıkışmaması için kapalı kasa cihazlar tercih edilebilir veya açık kasa cihazlarda çalışma alanı net bir şekilde sınırlandırılmalıdır.",
          "**Doğru Havalandırma:** Yazıcının bulunduğu odayı düzenli olarak havalandırmak veya cihazı hava akışı olan bir alanda çalıştırmak önemlidir.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "2. Sağlığa Zararsız Filament Seçimi: PLA ve PLA+",
      },
      {
        type: "paragraph",
        text: "3D yazıcılarda kullanılan hammaddelere \"filament\" denir. Piyasada ABS, PETG gibi farklı endüstriyel plastik türleri bulunsa da **çocuklar için ev ortamında önerilen en uygun tercih PLA (Polilaktik Asit) filamentlerdir.**",
      },
      {
        type: "list",
        items: [
          "**Mısır Nişastası Bazlıdır:** PLA, mısır nişastası ve şeker kamışı gibi yenilenebilir kaynaklardan üretilen biyo-plastik bir malzemedir.",
          "**Düşük Koku Oranı:** ABS gibi petrol türevi plastikler eritildiğinde keskin koku ve zararlı gazlar yayarken, PLA baskı esnasında hafif ve rahatsız etmeyen bir koku çıkarır.",
          "**Eğitim Dostudur:** Kolay şekil alır, düşük sıcaklıklarda erir; ev ve eğitim kullanımı için en uygun ve tercih edilen seçenektir.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "3. Yaşa Uygun 3D Modelleme Yazılımları",
      },
      {
        type: "paragraph",
        text: "Cihazı satın almadan önce çocuğun bilgisayarda modelleme yapabilmesi önemlidir. Çocuğunuzu karmaşık endüstriyel tasarım programlarıyla sıkmak yerine yaşına uygun araçlarla başlatmalısınız:",
      },
      {
        type: "list",
        items: [
          "**Başlangıç Seviyesi (8-11 Yaş):** Sürükle-bırak mantığıyla çalışan, küp, silindir gibi temel geometrik şekilleri birleştirerek model oluşturan blok tabanlı basit arayüzler kullanılmalıdır.",
          "**Orta Seviye (12+ Yaş):** Ölçülü çizim yapmayı, teknik boyutlandırmayı ve pah kırma/pah yuvarlatma gibi temel mühendislik detaylarını içeren başlangıç düzey teknik programlara geçilebilir.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "4. Evde Tek Başına mı, Atölye Destekli mi?",
      },
      {
        type: "paragraph",
        text: "Birçok veli cihazı eve alıp çocuğa teslim ettiğinde ilk birkaç denemedeki hizalama hataları, tablaya yapışmama veya nozul tıkanması gibi teknik aksaklıklar nedeniyle çocuğun hevesinin kırıldığını görür.",
      },
      {
        type: "paragraph",
        text: "Bu nedenle en sağlıklı yaklaşım; çocuğun öncelikle **temel modelleme ve yazıcı mantığını bir atölye ortamında uzman eşliğinde tecrübe etmesi**, ardından kendi cihazıyla evde özgürce üretim yapmasıdır.",
      },
      {
        type: "note",
        text: "(Çocuğunuzun mantık ve üretim arasındaki farkı nasıl kavradığını öğrenmek için [Robotik Kodlama ile 3D Tasarım Arasındaki Fark](/rehber/robotik-kodlama-ile-3d-tasarim-arasindaki-fark) rehberimizi inceleyebilirsiniz.)",
      },
      {
        type: "heading",
        level: 2,
        text: "Denizli'de D2P Academy ile İlk Adım",
      },
      {
        type: "paragraph",
        text: "D2P Academy olarak, çocuklarımıza sadece cihaz kullanmayı değil; bir fikri doğru ölçülerle tasarlayıp, malzeme bilgisini öğrenerek güvenli şekilde üretime dönüştürmeyi öğretiyoruz. ATH Mühendislik altyapımızla hazırladığımız eğitimlerde çocuklarımız üretim disiplinini yaşayarak kavrıyor.",
      },
      {
        type: "callout",
        title: "**Çocuğunuzun İlk 3D Tasarım Deneyimi İçin Yanınızdayız**",
        paragraphs: [
          "Denizli'de düzenlediğimiz gelecek atölyeleri ve eğitim takvimimiz hakkında detaylı bilgi almak için [D2P Veli Rehberi](/veli-rehberi) sayfamızı ziyaret edebilir veya gerçekleşen atölyelerimizi incelemek için [Atölyelerimiz](/etkinlikler) bölümüne göz atabilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "okullar-ve-belediyeler-icin-kurumsal-3d-tasarim-atolyesi",
    title: "Okullar ve Belediyeler İçin Kurumsal 3D Tasarım Atölyesi Nasıl Planlanır?",
    description:
      "Okullar ve belediyeler için kurumsal 3D tasarım atölyesi nasıl kurulur? Denizli'de D2P Academy'den ekipman, müfredat ve bütçe planlama rehberi.",
    publishedAt: "2026-08-12",
    blocks: [
      {
        type: "paragraph",
        text: "Geleceğin eğitim vizyonunda çocukların sadece teorik bilgiyle değil, uygulamalı üretim teknolojileriyle buluşması büyük bir öncelik haline geldi. Özel okullar, kolejler ve belediyelerin gençlik merkezleri; çocukları erken yaşta STEM, 3D tasarım ve katmanlı üretim teknolojileriyle buluşturacak atölye ve yaz kursu projelerine her geçen gün daha fazla yatırım yapıyor.",
      },
      {
        type: "paragraph",
        text: "Ancak kurumsal düzeyde sürdürülebilir, güvenli ve pedagojik olarak verimli bir 3D tasarım atölyesi kurmak; yalnızca birkaç 3D yazıcı satın almaktan çok daha fazlasını gerektirir.",
      },
      {
        type: "paragraph",
        text: "Denizli'de ATH Mühendislik ve D2P Academy güvencesiyle yürüttüğümüz kurumsal projelerden edindiğimiz tecrübeyle, okullar ve belediyeler için adım adım kurumsal atölye planlama rehberini hazırladık.",
      },
      {
        type: "heading",
        level: 2,
        text: "1. İhtiyaç Analizi ve Hedef Kitle Belirleme",
      },
      {
        type: "paragraph",
        text: "Atölyenin ilk aşaması, katılım sağlayacak yaş grubunun ve hedeflenen çıktıların netleştirilmesidir:",
      },
      {
        type: "list",
        items: [
          "**Yaş Grubu Uyumlandırması:** İlkokul düzeyinde merak uyandırıcı ve temel geometriye dayalı modüller seçilirken; ortaokul ve lise düzeyinde ölçülü teknik çizim, prototipleme ve mühendislik mantığı ön plana çıkarılmalıdır.",
          "**Kapasite ve Grup Büyüklüğü:** Verimli bir uygulama için ideal sınıf mevcudu 10-15 öğrenci arasında tutulmalıdır. Bu sayı, her öğrencinin bilgisayar ve yazıcı başında birebir uygulama yapabilmesini sağlar.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "2. Teknik Altyapı ve Ekipman Planlaması",
      },
      {
        type: "paragraph",
        text: "Bir kurumda 3D atölyesi kurgulanırken yapılan en büyük hata, yanlış ekipman seçimi ve altyapı yetersizliğidir:",
      },
      {
        type: "list",
        items: [
          "**3D Yazıcı Seçimi:** Eğitim ortamlarında hızlı, sessiz, kalibrasyonu kolay ve kapalı/güvenli kasaya sahip FDM yazıcılar tercih edilmelidir.",
          "**Bilgisayar Altyapısı:** Kullanılacak 3D modelleme yazılımlarını takılmadan çalıştırabilecek donanıma sahip bilgisayar lab ortamı hazır olmalıdır.",
          "**Sarf Malzeme ve Güvenlik:** Öğrencilerin sağlığına uygun biyo-plastik (PLA/PLA+) filamentler stoklanmalı, atölye ortamının havalandırma ve elektrik yükü altyapısı kontrol edilmelidir.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "3. Uygulamalı Müfredat ve Eğitmen Eğitimi",
      },
      {
        type: "paragraph",
        text: "Cihazlar ve yazılımlar ne kadar gelişmiş olursa olsun, atölyenin başarısını belirleyen ana unsur **doğru müfredat ve uzman eğitmen** varlığıdır.",
      },
      {
        type: "paragraph",
        text: "Atölye programı sadece yazılım butonlarını öğretmekle kalmamalı; *\"Fikirden Ürüne\"* giden süreçte öğrencilere problem çözme, ölçüm alma ve kendi tasarımlarını yazıcıdan çıkartma disiplinini kazandırmalıdır. Kurum içi eğitmenlerin bu süreçte hem teknik arıza müdahalesi hem de pedagojik yaklaşım konusunda yetkin olması şarttır.",
      },
      {
        type: "heading",
        level: 2,
        text: "4. Bütçe ve Sürdürülebilirlik",
      },
      {
        type: "paragraph",
        text: "Kurumsal atölyelerin sadece birkaç haftalık geçici bir etkinlik olarak kalmaması için sürdürülebilir bir operasyon planı yapılmalıdır. Sarf malzeme tedariki, periyodik cihaz bakımları ve dönem sonu proje sergileri/sertifikalandırma süreçleri baştan bütçelenmelidir.",
      },
      {
        type: "heading",
        level: 2,
        text: "D2P Academy Kurumsal Çözüm Ortaklığı",
      },
      {
        type: "paragraph",
        text: "Okulunuzda veya belediyenizde sıfırdan atölye kurmak, ekipman tedarik etmek ve müfredat hazırlamak yüksek zaman ve maliyet yükü getirebilir.",
      },
      {
        type: "paragraph",
        text: "D2P Academy olarak, ATH Mühendislik'in endüstriyel tecrübesi ve uzman kadrosuyla okullar ve belediyeler için **anahtar teslim kurumsal atölye çözümleri** sunuyoruz:",
      },
      {
        type: "list",
        items: [
          "**Mobil / Süreli Atölyeler:** Kendi ekipman ve 3D yazıcı parkurumuzla kurumunuza gelerek kısa süreli yaz kursları ve STEM atölyeleri düzenliyoruz. (Örnek çalışmamız için [Honaz Belediyesi 3D Yaz Kursu](/rehber/honaz-belediyesi-3d-yaz-kursu) yazımızı inceleyebilirsiniz.)",
          "**Kurumsal Müfredat ve Eğitmen Desteği:** Kurumunuz bünyesinde sürekli çalışacak atölyeler için müfredat temini, eğitmen eğitimi ve teknik danışmanlık sağlıyoruz.",
        ],
      },
      {
        type: "callout",
        title: "**Kurumunuz İçin Özel Atölye Projesi Planlayalım**",
        paragraphs: [
          "Okulunuz, belediyeniz veya eğitim kurumunuz için özelleştirilmiş 3D tasarım ve STEM atölye teklifi almak üzere [Kurumsal Talep Formu](/kurumsal-talep) sayfamız üzerinden bizimle iletişime geçebilir ya da detaylı bilgi için [D2P Academy İletişim](/iletisim) kanalından ekibimize ulaşabilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "sertifikanizi-nasil-dogrularsiniz",
    title: "D2P Academy Sertifikanızı Nasıl Doğrularsınız? (Sıkça Sorulan Sorular)",
    description:
      "D2P Academy sertifikanızı nasıl doğrularsınız? Sertifika kodu, QR kod okutma ve doğrulama ekranında görünen bilgiler hakkında sıkça sorulan sorular.",
    publishedAt: "2026-08-12",
    blocks: [
      {
        type: "paragraph",
        text: "D2P Academy bünyesinde veya iş birliği yaptığımız okullar ve belediyeler çatısı altında gerçekleştirdiğimiz 3D tasarım ve STEM atölyelerini başarıyla tamamlayan tüm katılımcılarımıza dijital olarak doğrulanabilir başarı/katılım sertifikaları sunuyoruz.",
      },
      {
        type: "paragraph",
        text: "Sertifikalarımızın üzerindeki benzersiz kod ve QR sistemleri sayesinde, alınan eğitimin geçerliliği ve içeriği dilediğiniz zaman dijital ortamda teyit edilebilir. Sertifika sorgulama süreciyle ilgili en çok merak edilen soruları sizler için derledik.",
      },
      {
        type: "heading",
        level: 2,
        text: "Sıkça Sorulan Sorular (SSS)",
      },
      {
        type: "heading",
        level: 3,
        text: "1. D2P Academy sertifikamı nereden doğrulatabilirim?",
      },
      {
        type: "paragraph",
        text: "Sertifikanızın geçerliliğini doğrulamak için ana sayfamızdaki [Sertifika Doğrulama](/#certificate) bölümünü ziyaret edebilirsiniz. Bu bölümdeki arama kutusuna sertifikanızın üzerinde yer alan benzersiz sertifika kodunu girip «Doğrula» düğmesine basmanız yeterlidir. Belgedeki QR kodu okuttuğunuzda ise doğrudan `/dogrula/sertifika-kodunuz` adresine yönlendirilir ve sorgu otomatik başlar.",
      },
      {
        type: "heading",
        level: 3,
        text: "2. Sertifika kodu belgenin neresinde yer alır?",
      },
      {
        type: "paragraph",
        text: "Sertifika kodu, size teslim edilen fiziki veya dijital sertifika belgesinin **sol alt bölümünde** «Sertifika No» satırında yer alan harf ve sayılardan oluşan özel bir koddur (örnek format: `D2P-XX-YY-#####` veya eski format: `D2P-YYYY-####`). Ayrıca belgenin alt orta kısmındaki QR kodu akıllı telefonunuzun kamerasıyla okutarak da doğrudan doğrulama sayfasına yönlendirilebilirsiniz.",
      },
      {
        type: "heading",
        level: 3,
        text: "3. Sertifikamı doğruladığımda hangi bilgiler görüntülenir?",
      },
      {
        type: "paragraph",
        text: "Sertifika doğrulama ekranında güvenliği ve şeffaflığı sağlamak adına şu bilgiler yer alır:",
      },
      {
        type: "list",
        items: [
          "Katılımcının adı ve soyadı",
          "Tamamlanan eğitimin/atölyenin adı (örn. *3D Tasarım ve Katmanlı Üretim Giriş Eğitimi*)",
          "Veriliş tarihi",
          "Belgenin benzersiz sertifika kodu ve geçerlilik onayı",
        ],
      },
      {
        type: "heading",
        level: 3,
        text: '4. Kodumu girdiğimde "Sertifika bulunamadı veya geçersiz." uyarısı alıyorum, ne yapmalıyım?',
      },
      {
        type: "paragraph",
        text: "Eğer sistem sertifikanızı doğrulayamıyorsa lütfen şu adımları kontrol edin:",
      },
      {
        type: "orderedList",
        items: [
          "Sertifika kodundaki **0 (sıfır)** ve **O (harf)** gibi benzer karakterleri doğru girdiğinizden emin olun.",
          "Kodu başında veya sonunda boşluk bırakmadan tekrar yazın.",
        ],
      },
      {
        type: "paragraph",
        text: "Sorun devam ediyorsa, belgeniz henüz dijital veritabanına aktarılma aşamasında olabilir. Destek almak için sertifika kodunuz ve adınızla birlikte [İletişim](/iletisim) sayfamız üzerinden ekibimize ulaşabilirsiniz.",
      },
      {
        type: "heading",
        level: 3,
        text: "5. D2P Academy sertifikaları nerede geçerlidir?",
      },
      {
        type: "paragraph",
        text: "Sertifikalarımız, ATH Mühendislik'in endüstriyel 3D baskı, ürün geliştirme ve tersine mühendislik alanındaki teknik birikimiyle onaylanan geçerli başarı/katılım belgeleridir. Öğrencilerin portfolyolarına eklenebilir ve uygulamalı teknik yetkinlik göstergesi olarak kullanılabilir.",
      },
      {
        type: "heading",
        level: 2,
        text: "Sertifikanızı Hemen Sorgulayın",
      },
      {
        type: "paragraph",
        text: "Eğitiminizi başarıyla tamamladıysanız ve belgenizi doğrulamak istiyorsanız aşağıdaki bağlantı üzerinden sorgulama ekranına ulaşabilirsiniz:",
      },
      {
        type: "callout",
        title: "🔍 [D2P Academy Sertifika Doğrulama Sayfasına Git](/#certificate)",
        paragraphs: [
          "Çocuğunuzun geleceğin üretim teknolojileriyle tanıştığı atölyelerimizi incelemek için [Denizli'de Çocuklar İçin 3D Tasarım Eğitimi](/rehber/denizli-cocuklar-icin-3d-tasarim-egitimi) rehberimize göz atabilirsiniz.",
        ],
      },
    ],
  },
];

export function getGuideArticleBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((article) => article.slug === slug);
}
