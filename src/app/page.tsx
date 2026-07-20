import { CertificateVerificationBar } from "@/presentation/components/home/certificate-verification-bar";
import { EventCalendarPreview } from "@/presentation/components/home/event-calendar-preview";
import { GalleryHomePreview } from "@/presentation/components/home/gallery-home-preview";
import { HeroSection } from "@/presentation/components/home/hero-section";
import { KaklikCampaignBanner } from "@/presentation/components/home/kaklik-campaign-banner";
import { KaklikRegistrationSection } from "@/presentation/components/home/kaklik-registration-section";
import { LearningValuesSection } from "@/presentation/components/home/learning-values-section";
import { getKaklikCampaignSettings } from "@/infrastructure/settings/site-settings";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const client = await createSupabaseServerClient();
  const campaign = client ? await getKaklikCampaignSettings(client) : null;

  return (
    <>
      {campaign?.enabled ? (
        <KaklikCampaignBanner title={campaign.title} bannerText={campaign.bannerText} />
      ) : null}
      <HeroSection />
      <EventCalendarPreview />
      {campaign?.enabled ? (
        <KaklikRegistrationSection
          title={campaign.title}
          description={campaign.description}
          note={campaign.note}
        />
      ) : null}
      <LearningValuesSection />
      <CertificateVerificationBar />
      <GalleryHomePreview />
    </>
  );
}
