import { ParentGuideContent } from "@/presentation/components/guides/parent-guide-content";
import { parentGuidePageMetadata } from "@/shared/seo/public-pages";

export const metadata = parentGuidePageMetadata;

export default function ParentGuidePage() {
  return (
    <div className="min-h-screen bg-surface-section">
      <ParentGuideContent />
    </div>
  );
}
