import { HeroSection } from "@/presentation/components/home/hero-section";
import { CertificateVerificationBar } from "@/presentation/components/home/certificate-verification-bar";
import { EventCalendarPreview } from "@/presentation/components/home/event-calendar-preview";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CertificateVerificationBar />
      <EventCalendarPreview />
    </>
  );
}
