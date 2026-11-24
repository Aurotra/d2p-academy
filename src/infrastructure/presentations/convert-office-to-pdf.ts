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

/**
 * Convert PowerPoint bytes to PDF for the secure browser viewer.
 * Uses officetopdf-js (no LibreOffice / Chromium required).
 */
export async function convertPptxToPdf(input: {
  bytes: Uint8Array;
  fileName: string;
}): Promise<{ pdfBytes: Uint8Array; warnings: string[] }> {
  const { pptxToPdf } = await import("officetopdf-js");
  const warnings: string[] = [];

  const pdf = await pptxToPdf(input.bytes, {
    // Landscape decks are common for classroom presentations.
    landscape: true,
    onWarning: (warning: { message?: string }) => {
      if (warning?.message) {
        warnings.push(warning.message);
      }
    },
  });

  return { pdfBytes: pdf, warnings };
}

/** Lightweight page estimate for freshly generated PDFs (no pdfjs worker on server). */
export async function countPdfPagesFromBytes(pdfBytes: Uint8Array): Promise<number> {
  const text = Buffer.from(pdfBytes).toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return matches?.length ?? 0;
}
