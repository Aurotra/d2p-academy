"use client";

const LO_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@matbee/libreoffice-converter@2.7.2/wasm/";

/** Same-origin worker scripts under /libreoffice (see next.config COEP headers). */
const LO_BROWSER_WORKER = "/libreoffice/browser.worker.global.js";
const LO_PTHREAD_WORKER = "/libreoffice/soffice.worker.js";

/**
 * Browsers block `new Worker(crossOriginUrl)`. Even same-origin workers created
 * from a COEP page must themselves be served with COEP — we also boot via blob
 * URL so a stale/missing worker header cannot silently hang on "Starting worker…".
 */
async function createBlobWorkerUrl(scriptUrl: string): Promise<string> {
  const response = await fetch(scriptUrl, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Dönüştürücü worker yüklenemedi (${response.status}).`);
  }
  const source = await response.text();
  const blob = new Blob([source], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}

/**
 * Convert PPTX → PDF in the admin browser via LibreOffice WASM.
 * Large WASM/data stay on CDN; workers are served from this origin.
 */
export async function convertPptxInBrowser(
  file: File,
  onProgress?: (message: string) => void,
): Promise<File> {
  onProgress?.("LibreOffice dönüştürücü yükleniyor…");

  const { WorkerBrowserConverter, createWasmPaths } = await import(
    "@matbee/libreoffice-converter/browser"
  );

  const browserWorkerJs = await createBlobWorkerUrl(LO_BROWSER_WORKER);

  const converter = new WorkerBrowserConverter({
    ...createWasmPaths(LO_WASM_CDN),
    sofficeWorkerJs: LO_PTHREAD_WORKER,
    browserWorkerJs,
    onProgress: (info: { percent?: number; message?: string; phase?: string }) => {
      const pct = typeof info.percent === "number" ? `${Math.round(info.percent)}% ` : "";
      onProgress?.(`${pct}${info.message || info.phase || "Dönüştürülüyor…"}`);
    },
  });

  try {
    await converter.initialize();
    onProgress?.("Sunum PDF’e dönüştürülüyor…");
    const input = new Uint8Array(await file.arrayBuffer());
    const result = await converter.convert(input, { outputFormat: "pdf" }, file.name);
    const pdfName = file.name.replace(/\.(pptx|ppt)$/i, "") + ".pdf";
    const pdfBytes = Uint8Array.from(result.data);
    return new File([pdfBytes], pdfName, { type: "application/pdf" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/timeout|Worker|COEP|SharedArrayBuffer|SecurityError/i.test(message)) {
      throw new Error(
        `${message} — Alternatif: PowerPoint’te Dosya → PDF olarak kaydet, sonra PDF yükle.`,
      );
    }
    throw error;
  } finally {
    try {
      await converter.destroy?.();
    } catch {
      /* ignore */
    }
    URL.revokeObjectURL(browserWorkerJs);
  }
}
