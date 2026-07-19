import { CertificateVerificationBar } from "@/presentation/components/home/certificate-verification-bar";
import { EventCalendarPreview } from "@/presentation/components/home/event-calendar-preview";
import { GalleryHomePreview } from "@/presentation/components/home/gallery-home-preview";
import { HeroSection } from "@/presentation/components/home/hero-section";
import { KaklikCampaignBanner } from "@/presentation/components/home/kaklik-campaign-banner";
import { KaklikRegistrationSection } from "@/presentation/components/home/kaklik-registration-section";
import { LearningValuesSection } from "@/presentation/components/home/learning-values-section";
import { KAKLIK_CAMPAIGN_ENABLED } from "@/shared/constants/kaklik-campaign";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      {KAKLIK_CAMPAIGN_ENABLED ? <KaklikCampaignBanner /> : null}
      <HeroSection />
      {KAKLIK_CAMPAIGN_ENABLED ? <KaklikRegistrationSection /> : null}
      <LearningValuesSection />
      <GalleryHomePreview />
      <CertificateVerificationBar />
      <EventCalendarPreview />
    </>
  );
}
