import { CertificateVerificationBar } from "@/presentation/components/home/certificate-verification-bar";
import { EventCalendarPreview } from "@/presentation/components/home/event-calendar-preview";
import { GalleryHomePreview } from "@/presentation/components/home/gallery-home-preview";
import { HeroSection } from "@/presentation/components/home/hero-section";
import { KaklikCampaignBanner } from "@/presentation/components/home/kaklik-campaign-banner";
import { KaklikRegistrationSection } from "@/presentation/components/home/kaklik-registration-section";
import { LearningValuesSection } from "@/presentation/components/home/learning-values-section";
import { isKaklikCampaignEnabled } from "@/infrastructure/settings/site-settings";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const client = await createSupabaseServerClient();
  const campaignEnabled = client ? await isKaklikCampaignEnabled(client) : false;

  return (
    <>
      {campaignEnabled ? <KaklikCampaignBanner /> : null}
      <HeroSection />
      {campaignEnabled ? <KaklikRegistrationSection /> : null}
      <LearningValuesSection />
      <GalleryHomePreview />
      <CertificateVerificationBar />
      <EventCalendarPreview />
    </>
  );
}
