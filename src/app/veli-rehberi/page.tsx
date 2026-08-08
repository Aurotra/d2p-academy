import { ParentGuideContent } from "@/presentation/components/guides/parent-guide-content";
import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { parentGuidePageMetadata } from "@/shared/seo/public-pages";

export const metadata = parentGuidePageMetadata;

export default function ParentGuidePage() {
  return (
    <PublicPageShell>
      <ParentGuideContent />
    </PublicPageShell>
  );
}
