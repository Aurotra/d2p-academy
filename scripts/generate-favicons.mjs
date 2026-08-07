import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const LOGO_PATH = path.join(ROOT, "public/d2p-logo.svg");
const FAVICON_VIEW_BOX = "50 50 1750 820";

async function main() {
  const raw = await readFile(LOGO_PATH, "utf8");
  const croppedSvg = raw.replace(/viewBox="[^"]*"/, `viewBox="${FAVICON_VIEW_BOX}"`);

  await writeFile(path.join(ROOT, "public/d2p-favicon.svg"), croppedSvg, "utf8");

  const raster = sharp(Buffer.from(croppedSvg), { density: 300 })
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png();

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
