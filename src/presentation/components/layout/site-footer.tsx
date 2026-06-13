export function SiteFooter() {
  return (
    <footer className="border-t border-navy-800 bg-navy-950 text-cyan-100/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-lg font-bold text-white">D2P Academy</p>
          <p className="mt-1 max-w-xl text-sm">
            Okullara ve öğrencilere yönelik modern, ölçeklenebilir eğitim platformu.
          </p>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} D2P Academy. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
