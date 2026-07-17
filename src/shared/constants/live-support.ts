const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID?.trim() ?? "";
const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID?.trim() || "default";
const isEnabled = process.env.NEXT_PUBLIC_TAWK_ENABLED === "true";

export const TAWK_PROPERTY_ID = propertyId;
export const TAWK_WIDGET_ID = widgetId;

export function isTawkConfigured(): boolean {
  return isEnabled && Boolean(TAWK_PROPERTY_ID);
}

export function getTawkEmbedSrc(): string | null {
  if (!isTawkConfigured()) {
    return null;
  }

  return `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
}
