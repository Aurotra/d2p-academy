import { AboutPageContent } from "@/presentation/components/about/about-page-content";
import { aboutPageMetadata } from "@/shared/seo/public-pages";

export const metadata = aboutPageMetadata;

export default function AboutPage() {
  return <AboutPageContent />;
}
