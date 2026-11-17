/**
 * Copies only the Three.js modules D2P Tasarım needs into public/tasarim/vendor.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendor = path.join(root, "public", "tasarim", "vendor");
const nm = path.join(root, "node_modules");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(from, to) {
  if (!fs.existsSync(from)) {
    console.error("Missing:", from);
    process.exit(1);
  }
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

fs.rmSync(vendor, { recursive: true, force: true });

copyFile(
  path.join(nm, "three", "build", "three.module.js"),
  path.join(vendor, "three", "three.module.js"),
);

const addons = [
  "controls/OrbitControls.js",
  "controls/TransformControls.js",
  "exporters/STLExporter.js",
  "geometries/TextGeometry.js",
  "loaders/FontLoader.js",
];

for (const rel of addons) {
  copyFile(
    path.join(nm, "three", "examples", "jsm", rel),
    path.join(vendor, "three", "addons", rel),
  );
}

copyFile(
  path.join(nm, "three-mesh-bvh", "build", "index.module.js"),
  path.join(vendor, "three-mesh-bvh", "index.module.js"),
);
copyFile(
  path.join(nm, "three-bvh-csg", "build", "index.module.js"),
  path.join(vendor, "three-bvh-csg", "index.module.js"),
);

console.log("Synced lean public/tasarim/vendor");
