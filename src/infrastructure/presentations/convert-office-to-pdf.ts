import "server-only";

import { createRequire } from "node:module";
import { copyFileSync, existsSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const LO_VERSION = "2.7.2";
const CACHE_TAG = "v2";

/** Dedicated mirror (jsDelivr returns 403 for this oversized npm package). */
const LO_CDN_PRIMARY = "https://erseco.github.io/libreoffice-document-converter/wasm";
const LO_CDN_FALLBACK = `https://unpkg.com/@matbee/libreoffice-converter@${LO_VERSION}/wasm`;

/** Binaries + loader that must sit together so loader.cjs `__dirname` resolves assets. */
const WASM_ASSETS = [
  "loader.cjs",
  "soffice.js",
  "soffice.cjs",
  "soffice.wasm",
  "soffice.data",
  "soffice.worker.js",
  "soffice.worker.cjs",
] as const;

type WasmLoader = {
  createModule: (config: Record<string, unknown>) => Promise<unknown>;
};

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
  return path.join(os.tmpdir(), `libreoffice-wasm-${LO_VERSION}-${CACHE_TAG}`);
}

function packageWasmDir(): string {
  return path.join(
    process.cwd(),
    "node_modules",
    "@matbee",
    "libreoffice-converter",
    "wasm",
  );
}

function rootRequire() {
  return createRequire(path.join(process.cwd(), "package.json"));
}

async function downloadToFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WASM indirilemedi (${response.status}): ${url}`);
  }
  await writeFile(destPath, Buffer.from(await response.arrayBuffer()));
}

async function materializeAsset(name: (typeof WASM_ASSETS)[number], dest: string): Promise<void> {
  const localSource = path.join(packageWasmDir(), name);
  if (existsSync(localSource)) {
    const info = await stat(localSource);
    if (info.size > 0) {
      copyFileSync(localSource, dest);
      return;
    }
  }

  const urls = [`${LO_CDN_PRIMARY}/${name}`, `${LO_CDN_FALLBACK}/${name}`];
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      console.info(`[pptx-convert] downloading ${name} from ${url}`);
      await downloadToFile(url, dest);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[pptx-convert] ${name} failed:`, lastError.message);
    }
  }
  throw lastError ?? new Error(`${name} indirilemedi.`);
}

async function ensureWasmAssets(): Promise<string> {
  const dir = wasmCacheDir();
  await mkdir(dir, { recursive: true });

  const readyMarker = path.join(dir, ".ready");
  if (existsSync(readyMarker) && existsSync(path.join(dir, "loader.cjs"))) {
    return dir;
  }

  for (const name of WASM_ASSETS) {
    const dest = path.join(dir, name);
    if (existsSync(dest)) {
      const info = await stat(dest);
      if (info.size > 0) continue;
    }
    await materializeAsset(name, dest);
  }

  const wasmStat = await stat(path.join(dir, "soffice.wasm"));
  const dataStat = await stat(path.join(dir, "soffice.data"));
  if (wasmStat.size < 50_000_000 || dataStat.size < 50_000_000) {
    throw new Error("LibreOffice WASM dosyaları eksik veya bozuk indirildi.");
  }

  await writeFile(readyMarker, new Date().toISOString(), "utf8");
  return dir;
}

function loadWasmLoader(wasmPath: string): WasmLoader {
  const loaderPath = path.join(wasmPath, "loader.cjs");
  const requireFromLoader = createRequire(loaderPath);
  const raw = requireFromLoader(loaderPath) as Record<string, unknown> & {
    default?: Record<string, unknown>;
  };
  const candidate = (
    typeof raw.createModule === "function"
      ? raw
      : typeof raw.default?.createModule === "function"
        ? raw.default
        : null
  ) as WasmLoader | null;

  if (!candidate) {
    throw new Error(
      `wasmLoader.createModule bulunamadı (${loaderPath}). exports=${Object.keys(raw ?? {}).join(",")}`,
    );
  }

  return {
    createModule: candidate.createModule.bind(candidate),
  };
}

function loadCreateConverter(): (options: Record<string, unknown>) => Promise<{
  convert: (
    input: Uint8Array,
    options: { outputFormat: string },
    filename?: string,
  ) => Promise<{ data: Uint8Array }>;
  destroy?: () => Promise<void>;
}> {
  const req = rootRequire();
  // Prefer CJS build — more reliable under Next serverless externals than ESM dynamic import.
  const server = req("@matbee/libreoffice-converter/dist/server.cjs") as Record<string, unknown> & {
    default?: Record<string, unknown>;
  };
  const createConverter =
    (typeof server.createConverter === "function" && server.createConverter) ||
    (typeof server.default?.createConverter === "function" && server.default.createConverter);

  if (typeof createConverter !== "function") {
    throw new Error(
      `createConverter bulunamadı. exports=${Object.keys(server ?? {}).join(",")}`,
    );
  }

  return createConverter as ReturnType<typeof loadCreateConverter>;
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
  const wasmLoader = loadWasmLoader(wasmPath);
  const createConverter = loadCreateConverter();

  const converter = await createConverter({
    wasmPath,
    wasmLoader,
    verbose: true,
  });

  try {
    const result = await converter.convert(input.bytes, { outputFormat: "pdf" }, input.fileName);
    if (!result?.data) {
      throw new Error("Dönüşüm sonucu boş döndü.");
    }
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
