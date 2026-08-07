import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const LOGO_PATH = path.join(ROOT, "public/d2p-logo.svg");
/** Red "D" mark only — trim removes empty margins before squaring. */
const SOURCE_VIEW_BOX = "-34 75 773 773";
const CANVAS_SIZE = 512;
const PADDING_RATIO = 0.03;

function buildFaviconSvg(croppedSvg) {
  const innerMatch = croppedSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  const inner = innerMatch?.[1]?.trim() ?? "";
  const pad = 100 * PADDING_RATIO;
  const logoSize = 100 - pad * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#ffffff"/>
  <svg viewBox="${SOURCE_VIEW_BOX}" x="${pad}" y="${pad}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet">
${inner}
  </svg>
</svg>`;
}

async function buildMasterPng(raw) {
  const croppedSvg = raw.replace(/viewBox="[^"]*"/, `viewBox="${SOURCE_VIEW_BOX}"`);

  const trimmed = await sharp(Buffer.from(croppedSvg), { density: 400 })
    .png()
    .trim({ threshold: 10 })
    .toBuffer();

  const meta = await sharp(trimmed).metadata();
  const maxSide = Math.max(meta.width ?? 0, meta.height ?? 0);
  const pad = Math.round(maxSide * PADDING_RATIO);

  const squared = await sharp(trimmed)
    .extend({
      top: pad + Math.floor((maxSide - (meta.height ?? 0)) / 2),
      bottom: pad + Math.ceil((maxSide - (meta.height ?? 0)) / 2),
      left: pad + Math.floor((maxSide - (meta.width ?? 0)) / 2),
      right: pad + Math.ceil((maxSide - (meta.width ?? 0)) / 2),
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  return sharp(squared).resize(CANVAS_SIZE, CANVAS_SIZE, { fit: "fill" }).png().toBuffer();
}

async function main() {
  const raw = await readFile(LOGO_PATH, "utf8");
  const croppedSvg = raw.replace(/viewBox="[^"]*"/, `viewBox="${SOURCE_VIEW_BOX}"`);
  const faviconSvg = buildFaviconSvg(croppedSvg);
  const masterPng = await buildMasterPng(raw);
  const raster = sharp(masterPng);

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
