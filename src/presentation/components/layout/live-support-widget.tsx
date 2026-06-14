"use client";

const providerLabel =
  process.env.NEXT_PUBLIC_LIVE_SUPPORT_PROVIDER === "crisp" ? "Crisp" : "Tawk.to";

export function LiveSupportWidget() {
  return (
    <button
      type="button"
      aria-label="Canlı destek"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition hover:bg-primary-hover hover:shadow-glow-primary"
      onClick={() => {
        // Placeholder: Tawk.to / Crisp widget entegrasyonu buraya bağlanacak.
        window.alert(`${providerLabel} canlı destek widget'ı bir sonraki adımda entegre edilecek.`);
      }}
    >
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      Canlı Destek
    </button>
  );
}
