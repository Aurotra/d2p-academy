import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const LOGO_PATH = path.join(ROOT, "public/d2p-logo.svg");
/** D2P lettermarks without the Academy wordmark. */
const SOURCE_VIEW_BOX = "60 52 1715 848";
const CANVAS_SIZE = 512;
const PADDING_RATIO = 0.04;

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
  const masterPng = await buildMasterPng(raw);
  const raster = sharp(masterPng);

  const icon32Path = path.join(ROOT, "public/favicon-32x32.png");
  await raster.clone().resize(32, 32).png().toFile(icon32Path);
  await raster.clone().resize(180, 180).png().toFile(path.join(ROOT, "public/apple-icon.png"));
  await raster.clone().resize(192, 192).png().toFile(path.join(ROOT, "public/icon-192.png"));
  await raster.clone().resize(512, 512).png().toFile(path.join(ROOT, "public/icon-512.png"));
  await copyFile(icon32Path, path.join(ROOT, "public/favicon.ico"));

  console.log("PWA / fallback favicons generated in public/.");
  console.log("Browser tab icon is served from src/app/icon.tsx.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
