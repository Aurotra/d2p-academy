import { CertificateVerificationBar } from "@/presentation/components/home/certificate-verification-bar";
import { EventCalendarPreview } from "@/presentation/components/home/event-calendar-preview";
import { GalleryHomePreview } from "@/presentation/components/home/gallery-home-preview";
import { HeroSection } from "@/presentation/components/home/hero-section";
import { LearningValuesSection } from "@/presentation/components/home/learning-values-section";
import { publicPageMetadata } from "@/shared/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = publicPageMetadata({
  title: "3D Tasarım, 3D Baskı ve Robotik Eğitimleri",
  description:
    "D2P Academy — Denizli merkezli 3D tasarım, 3D baskı ve robotik atölye eğitimleri. Okullara ve öğrencilere yönelik modern STEM eğitim platformu.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <EventCalendarPreview />
      <LearningValuesSection />
      <CertificateVerificationBar />
      <GalleryHomePreview />
    </>
  );
}
