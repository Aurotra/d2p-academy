"use client";

const LO_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@matbee/libreoffice-converter@2.7.2/wasm/";

/** Same-origin worker scripts (browsers block cross-origin `new Worker(cdnUrl)`). */
const LO_BROWSER_WORKER = "/libreoffice/browser.worker.global.js";
const LO_PTHREAD_WORKER = "/libreoffice/soffice.worker.js";

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

  const converter = new WorkerBrowserConverter({
    ...createWasmPaths(LO_WASM_CDN),
    sofficeWorkerJs: LO_PTHREAD_WORKER,
    browserWorkerJs: LO_BROWSER_WORKER,
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
  } finally {
    try {
      await converter.destroy?.();
    } catch {
      /* ignore */
    }
  }
}
