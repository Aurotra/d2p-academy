import { BRAND_SURFACE_FOOTER } from "@/shared/constants/brand-surfaces";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";

export function SiteFooter() {
  return (
    <footer className={`${BRAND_SURFACE_FOOTER} text-sky-900`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <BrandLogo href="/" height={36} />
          <p className="max-w-xl text-sm text-sky-800">
            Okullara ve öğrencilere yönelik modern, ölçeklenebilir eğitim platformu.
          </p>
        </div>
        <p className="text-sm text-sky-700">
          © {new Date().getFullYear()} D2P Academy. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
