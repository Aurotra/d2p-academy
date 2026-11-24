/** Client-side PDF page count via pdfjs (dynamic import). */
export async function countPdfPages(file: File): Promise<number> {
  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return 0;
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages = doc.numPages;
  await doc.destroy();
  return pages;
}
