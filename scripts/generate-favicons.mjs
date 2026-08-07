import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const LOGO_PATH = path.join(ROOT, "public/d2p-logo.svg");
/** Square crop over the colorful D2P letterforms (no wordmark). */
const FAVICON_VIEW_BOX = "470 55 840 830";
const CANVAS_SIZE = 512;
const LOGO_INSET = 0.04;

function buildFaviconSvg(croppedSvg) {
  const innerMatch = croppedSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  const inner = innerMatch?.[1]?.trim() ?? "";
  const [vx, vy, vw, vh] = FAVICON_VIEW_BOX.split(" ").map(Number);
  const inset = 100 * LOGO_INSET;
  const logoSize = 100 - inset * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#ffffff"/>
  <svg viewBox="${vx} ${vy} ${vw} ${vh}" x="${inset}" y="${inset}" width="${logoSize}" height="${logoSize}">
${inner}
  </svg>
</svg>`;
}

async function buildRaster(croppedSvg) {
  const logoSize = Math.round(CANVAS_SIZE * (1 - LOGO_INSET * 2));

  const logoLayer = await sharp(Buffer.from(croppedSvg), { density: 400 })
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  const baseBuffer = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logoLayer, gravity: "center" }])
    .png()
    .toBuffer();

  return sharp(baseBuffer);
}

async function main() {
  const raw = await readFile(LOGO_PATH, "utf8");
  const croppedSvg = raw.replace(/viewBox="[^"]*"/, `viewBox="${FAVICON_VIEW_BOX}"`);
  const faviconSvg = buildFaviconSvg(croppedSvg);
  const raster = await buildRaster(croppedSvg);

  await writeFile(path.join(ROOT, "public/d2p-favicon.svg"), faviconSvg, "utf8");
  await mkdir(path.join(ROOT, "src/app"), { recursive: true });

  const icon32Path = path.join(ROOT, "public/favicon-32x32.png");
  await raster.clone().resize(32, 32).png().toFile(path.join(ROOT, "src/app/icon.png"));
  await raster.clone().resize(180, 180).png().toFile(path.join(ROOT, "src/app/apple-icon.png"));
  await raster.clone().resize(180, 180).png().toFile(path.join(ROOT, "public/apple-icon.png"));
  await raster.clone().resize(32, 32).png().toFile(icon32Path);
  await raster.clone().resize(192, 192).png().toFile(path.join(ROOT, "public/icon-192.png"));
  await raster.clone().resize(512, 512).png().toFile(path.join(ROOT, "public/icon-512.png"));
  await copyFile(icon32Path, path.join(ROOT, "public/favicon.ico"));

  console.log("Favicons generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
