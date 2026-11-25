import "server-only";

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

/** Lightweight page estimate for PDF uploads. */
export async function countPdfPagesFromBytes(pdfBytes: Uint8Array): Promise<number> {
  const text = Buffer.from(pdfBytes).toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return matches?.length ?? 0;
}
