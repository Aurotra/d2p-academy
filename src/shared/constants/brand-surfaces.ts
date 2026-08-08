/** Hero / auth backdrop — warm brand tint gradient (replaces sky-100/200/300). */
export const BRAND_SURFACE_GRADIENT = "bg-surface-hero";

/** Public content pages — subtle yellow→white→green wash with brand atmosphere. */
export const BRAND_SURFACE_PAGE =
  "bg-gradient-to-b from-surface-tint-yellow/40 via-white to-surface-tint-green/35";

/** Decorative glow blobs layered on public pages (use inside relative shell). */
export const BRAND_SURFACE_PAGE_GLOW =
  "pointer-events-none absolute rounded-full blur-3xl";

/** Standard elevated card on public pages. */
export const BRAND_SURFACE_CARD =
  "rounded-2xl border border-secondary/15 bg-white/95 shadow-md shadow-secondary/5 backdrop-blur-sm";

/** Larger feature card shell. */
export const BRAND_SURFACE_FEATURE_CARD =
  "rounded-[1.75rem] border border-secondary/15 bg-white/95 shadow-md shadow-secondary/5 backdrop-blur-sm transition hover:-translate-y-1 hover:border-secondary/30 hover:shadow-lg hover:shadow-secondary/10";

export type BrandAccent = "document" | "secondary" | "accent" | "primary";

const BRAND_ACCENT_ORDER: BrandAccent[] = ["document", "secondary", "accent", "primary"];

export function brandAccentAt(index: number): BrandAccent {
  return BRAND_ACCENT_ORDER[index % BRAND_ACCENT_ORDER.length]!;
}

export const BRAND_ACCENT_CARD_STYLES: Record<BrandAccent, string> = {
  document:
    "border-document-primary/20 bg-gradient-to-br from-white via-surface-tint-mixed to-document-primary/10 shadow-md shadow-document-primary/10",
  secondary:
    "border-secondary/20 bg-gradient-to-br from-white via-teal-50/50 to-secondary/10 shadow-md shadow-secondary/10",
  accent:
    "border-accent-dark/20 bg-gradient-to-br from-white via-amber-50/60 to-accent/15 shadow-md shadow-accent/10",
  primary:
    "border-primary/20 bg-gradient-to-br from-white via-rose-50/50 to-primary/10 shadow-md shadow-primary/10",
};

export const BRAND_ACCENT_ICON_STYLES: Record<BrandAccent, string> = {
  document: "bg-document-primary/15 text-document-primary",
  secondary: "bg-secondary/15 text-secondary",
  accent: "bg-accent/25 text-accent-dark",
  primary: "bg-primary/15 text-primary",
};

/** Sticky header — warm translucent surface with brand border. */
export const BRAND_SURFACE_HEADER =
  "border-b border-border-surface bg-[rgb(250_248_245/0.95)] backdrop-blur-md supports-[backdrop-filter]:bg-[rgb(250_248_245/0.90)]";

/** Footer — subtle yellow-green brand wash. */
export const BRAND_SURFACE_FOOTER =
  "border-border-surface bg-gradient-to-b from-surface-tint-yellow to-surface-tint-green";

/** Standard public section background. */
export const BRAND_SURFACE_SECTION = "bg-surface-section";
