import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const LOGO_PATH = path.join(ROOT, "public/d2p-logo.svg");
/** Full brand logo (D2P + Academy wordmark). */
const SOURCE_VIEW_BOX = "0 0 1834 1109";
const CANVAS_SIZE = 512;
const PADDING_RATIO = 0.05;

async function buildMasterPng(raw) {
  const croppedSvg = raw.replace(/viewBox="[^"]*"/, `viewBox="${SOURCE_VIEW_BOX}"`);
  const logoSize = Math.round(CANVAS_SIZE * (1 - PADDING_RATIO * 2));

  const logoLayer = await sharp(Buffer.from(croppedSvg), { density: 400 })
    .resize(logoSize, logoSize, {
      fit: "inside",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
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
}

async function main() {
  const raw = await readFile(LOGO_PATH, "utf8");
  const masterPng = await buildMasterPng(raw);
  const raster = sharp(masterPng);

  await mkdir(path.join(ROOT, "src/app"), { recursive: true });

  const icon32Path = path.join(ROOT, "public/favicon-32x32.png");
  await raster.clone().resize(48, 48).png().toFile(path.join(ROOT, "src/app/icon.png"));
  await raster.clone().resize(180, 180).png().toFile(path.join(ROOT, "src/app/apple-icon.png"));
  await raster.clone().resize(32, 32).png().toFile(icon32Path);
  await raster.clone().resize(180, 180).png().toFile(path.join(ROOT, "public/apple-icon.png"));
  await raster.clone().resize(192, 192).png().toFile(path.join(ROOT, "public/icon-192.png"));
  await raster.clone().resize(512, 512).png().toFile(path.join(ROOT, "public/icon-512.png"));
  await copyFile(icon32Path, path.join(ROOT, "public/favicon.ico"));

  console.log("Favicons generated from d2p-logo.svg (white background).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
