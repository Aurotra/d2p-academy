import { ParentGuideContent } from "@/presentation/components/guides/parent-guide-content";
import { publicPageMetadata } from "@/shared/seo/metadata";

export const metadata = publicPageMetadata({
  title: "Veli Kayıt Rehberi",
  description:
    "D2P Academy veli kayıt, çocuk hesabı, etkinlik kaydı ve giriş adımlarını anlatan rehber ve sık sorulan sorular.",
  path: "/veli-rehberi",
});

export default function ParentGuidePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ParentGuideContent />
    </div>
  );
}
