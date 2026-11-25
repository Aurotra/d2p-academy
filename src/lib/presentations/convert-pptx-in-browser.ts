"use client";

const LO_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@matbee/libreoffice-converter@2.7.2/wasm/";

/**
 * Convert PPTX → PDF in the admin browser via LibreOffice WASM (CDN).
 * Avoids Vercel glibc/native binary issues and keeps slide layout faithful.
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
    ...createWasmPaths(LO_WASM_BASE),
    browserWorkerJs: `${LO_WASM_BASE}soffice.worker.js`,
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
