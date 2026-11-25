"use client";

const LO_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@matbee/libreoffice-converter@2.7.2/wasm/";

/**
 * Same-origin scripts under /libreoffice (COEP + CSP without strict-dynamic).
 * Large soffice.wasm / soffice.data stay on the CDN and are fetched, not importScripts.
 */
const LO_BROWSER_WORKER = "/libreoffice/browser.worker.global.js";
const LO_PTHREAD_WORKER = "/libreoffice/soffice.worker.js";
const LO_SOFFICE_JS = "/libreoffice/soffice.js";

/**
 * Convert PPTX → PDF in the admin browser via LibreOffice WASM.
 */
export async function convertPptxInBrowser(
  file: File,
  onProgress?: (message: string) => void,
): Promise<File> {
  onProgress?.("LibreOffice dönüştürücü yükleniyor…");

  const { WorkerBrowserConverter } = await import("@matbee/libreoffice-converter/browser");

  const converter = new WorkerBrowserConverter({
    sofficeJs: LO_SOFFICE_JS,
    sofficeWasm: `${LO_WASM_CDN}soffice.wasm`,
    sofficeData: `${LO_WASM_CDN}soffice.data`,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/timeout|Worker|importScripts|COEP|SharedArrayBuffer|SecurityError|failed to load/i.test(message)) {
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
  }
}
