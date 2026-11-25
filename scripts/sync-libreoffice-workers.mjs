import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "libreoffice");
const pkg = join(root, "node_modules", "@matbee", "libreoffice-converter");

const files = [
  ["dist/browser.worker.global.js", "browser.worker.global.js"],
  ["wasm/soffice.worker.js", "soffice.worker.js"],
];

if (!existsSync(join(pkg, "package.json"))) {
  console.warn("[sync-libreoffice-workers] package missing, skip");
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
for (const [fromRel, toName] of files) {
  copyFileSync(join(pkg, fromRel), join(outDir, toName));
}
console.log("[sync-libreoffice-workers] copied worker scripts to public/libreoffice");
