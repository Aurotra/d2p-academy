import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const LOGO_PATH = path.join(ROOT, "public/d2p-logo.svg");
const FAVICON_VIEW_BOX = "50 50 1750 820";
const CANVAS_SIZE = 512;

function buildFaviconSvg(croppedSvg) {
  const innerMatch = croppedSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  const inner = innerMatch?.[1]?.trim() ?? "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#ffffff"/>
  <svg viewBox="${FAVICON_VIEW_BOX}" x="4" y="33" width="92" height="46" preserveAspectRatio="xMidYMid meet">
${inner}
  </svg>
</svg>`;
}

async function main() {
  const raw = await readFile(LOGO_PATH, "utf8");
  const croppedSvg = raw.replace(/viewBox="[^"]*"/, `viewBox="${FAVICON_VIEW_BOX}"`);
  const faviconSvg = buildFaviconSvg(croppedSvg);

  await writeFile(path.join(ROOT, "public/d2p-favicon.svg"), faviconSvg, "utf8");

  const raster = sharp(Buffer.from(faviconSvg), { density: 300 }).resize(CANVAS_SIZE, CANVAS_SIZE, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  }).png();

  await mkdir(path.join(ROOT, "src/app"), { recursive: true });

  await raster.clone().resize(32, 32).png().toFile(path.join(ROOT, "src/app/icon.png"));
  await raster.clone().resize(180, 180).png().toFile(path.join(ROOT, "src/app/apple-icon.png"));
  await raster.clone().resize(180, 180).png().toFile(path.join(ROOT, "public/apple-icon.png"));
  await raster.clone().resize(32, 32).png().toFile(path.join(ROOT, "public/favicon-32x32.png"));
  await raster.clone().resize(192, 192).png().toFile(path.join(ROOT, "public/icon-192.png"));
  await raster.clone().resize(512, 512).png().toFile(path.join(ROOT, "public/icon-512.png"));

  console.log("Favicons generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
