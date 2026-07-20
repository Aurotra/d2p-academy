import { ParentGuideContent } from "@/presentation/components/guides/parent-guide-content";

export const metadata = {
  title: "Veli Kayıt Rehberi | D2P Academy",
  description:
    "D2P Academy veli kayıt, çocuk hesabı, etkinlik kaydı ve giriş adımlarını anlatan rehber ve sık sorulan sorular.",
};

export default function ParentGuidePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ParentGuideContent />
    </div>
  );
}
