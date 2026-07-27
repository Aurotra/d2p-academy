import { CertificateVerificationBar } from "@/presentation/components/home/certificate-verification-bar";
import { EventCalendarPreview } from "@/presentation/components/home/event-calendar-preview";
import { GalleryHomePreview } from "@/presentation/components/home/gallery-home-preview";
import { HeroSection } from "@/presentation/components/home/hero-section";
import { LearningValuesSection } from "@/presentation/components/home/learning-values-section";
import { homePageMetadata } from "@/shared/seo/public-pages";

export const dynamic = "force-dynamic";

export const metadata = homePageMetadata;

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
