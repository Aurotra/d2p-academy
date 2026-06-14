import { HeroSection } from "@/presentation/components/home/hero-section";
import { LearningValuesSection } from "@/presentation/components/home/learning-values-section";
import { CertificateVerificationBar } from "@/presentation/components/home/certificate-verification-bar";
import { EventCalendarPreview } from "@/presentation/components/home/event-calendar-preview";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LearningValuesSection />
      <CertificateVerificationBar />
      <EventCalendarPreview />
    </>
  );
}
