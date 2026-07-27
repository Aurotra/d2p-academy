import { AboutPageContent } from "@/presentation/components/about/about-page-content";
import { publicPageMetadata } from "@/shared/seo/metadata";

export const metadata = publicPageMetadata({
  title: "Hakkımızda",
  description:
    "D2P Academy; öğrencilerin 3D tasarım, prototipleme ve üretim becerilerini geliştiren, robotik kodlama eğitimlerini tamamlayıcı bütüncül bir mühendislik yaklaşımı sunar.",
  path: "/hakkimizda",
});

export default function AboutPage() {
  return <AboutPageContent />;
}
