import { readFile } from "node:fs/promises";
import path from "node:path";

/** Crop wordmark; keep the colorful D2P mark for small tab icons. */
const FAVICON_VIEW_BOX = "50 50 1750 820";

let cachedDataUrl: string | null = null;

export async function getFaviconLogoDataUrl(): Promise<string> {
  if (cachedDataUrl) {
    return cachedDataUrl;
  }

  const raw = await readFile(path.join(process.cwd(), "public/d2p-logo.svg"), "utf8");
  const cropped = raw.replace(/viewBox="[^"]*"/, `viewBox="${FAVICON_VIEW_BOX}"`);
  cachedDataUrl = `data:image/svg+xml;base64,${Buffer.from(cropped).toString("base64")}`;
  return cachedDataUrl;
}
