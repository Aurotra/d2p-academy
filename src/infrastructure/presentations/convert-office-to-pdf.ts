import "server-only";

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const LO_VERSION = "2.7.2";
const LO_CDN = `https://cdn.jsdelivr.net/npm/@matbee/libreoffice-converter@${LO_VERSION}/wasm`;

/** Binaries + loader that must sit together so loader.cjs `__dirname` resolves assets. */
const WASM_ASSETS = [
  "loader.cjs",
  "soffice.js",
  "soffice.cjs",
  "soffice.wasm",
  "soffice.data",
  "soffice.worker.js",
  "soffice.worker.cjs",
  "soffice.data.js.metadata",
] as const;

export function isPptxUpload(fileName: string, mimeType: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".pptx") ||
    lower.endsWith(".ppt") ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-powerpoint"
  );
}

export function isPdfUpload(fileName: string, mimeType: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".pdf") || mimeType === "application/pdf" || mimeType.includes("pdf");
}

function wasmCacheDir(): string {
  return path.join(os.tmpdir(), `libreoffice-wasm-${LO_VERSION}`);
}

async function downloadToFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WASM indirilemedi (${response.status}): ${url}`);
  }
  await writeFile(destPath, Buffer.from(await response.arrayBuffer()));
}

async function ensureWasmAssets(): Promise<string> {
  const dir = wasmCacheDir();
  await mkdir(dir, { recursive: true });

  const readyMarker = path.join(dir, ".ready");
  if (existsSync(readyMarker)) {
    return dir;
  }

  for (const name of WASM_ASSETS) {
    const dest = path.join(dir, name);
    if (existsSync(dest)) {
      const info = await stat(dest);
      if (info.size > 0) continue;
    }
    console.info(`[pptx-convert] downloading ${name}…`);
    await downloadToFile(`${LO_CDN}/${name}`, dest);
  }

  const wasmStat = await stat(path.join(dir, "soffice.wasm"));
  const dataStat = await stat(path.join(dir, "soffice.data"));
  if (wasmStat.size < 50_000_000 || dataStat.size < 50_000_000) {
    throw new Error("LibreOffice WASM dosyaları eksik veya bozuk indirildi.");
  }

  await writeFile(readyMarker, new Date().toISOString(), "utf8");
  return dir;
}

/**
 * Server-side PPTX→PDF via LibreOffice WASM.
 * Large binaries are cached under os.tmpdir() (Vercel /tmp) so the deploy bundle stays small.
 */
export async function convertPptxToPdf(input: {
  bytes: Uint8Array;
  fileName: string;
}): Promise<{ pdfBytes: Uint8Array; warnings: string[] }> {
  const wasmPath = await ensureWasmAssets();
  const requireFromWasm = createRequire(path.join(wasmPath, "loader.cjs"));
  // loader.cjs binds __dirname to /tmp cache so large CDN binaries resolve correctly.
  const wasmLoader = requireFromWasm(path.join(wasmPath, "loader.cjs"));

  // Main-thread converter so our /tmp wasmLoader (not package __dirname) is used.
  const { createConverter } = await import("@matbee/libreoffice-converter/server");
  const converter = await createConverter({
    wasmPath,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CJS loader shape
    wasmLoader: wasmLoader as any,
    verbose: process.env.NODE_ENV !== "production",
  });

  try {
    const result = await converter.convert(input.bytes, { outputFormat: "pdf" }, input.fileName);
    return {
      pdfBytes: new Uint8Array(result.data),
      warnings: [],
    };
  } finally {
    try {
      await converter.destroy?.();
    } catch {
      /* ignore */
    }
  }
}

/** Lightweight page estimate for freshly generated PDFs. */
export async function countPdfPagesFromBytes(pdfBytes: Uint8Array): Promise<number> {
  const text = Buffer.from(pdfBytes).toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return matches?.length ?? 0;
}
