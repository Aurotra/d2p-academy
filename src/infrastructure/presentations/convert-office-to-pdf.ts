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
 * Pure JS (pptx-to-pdf) — no native glibc binaries, works on Vercel.
 */
export async function convertPptxToPdf(input: {
  bytes: Uint8Array;
  fileName: string;
}): Promise<{ pdfBytes: Uint8Array; warnings: string[] }> {
  const { convert } = await import("pptx-to-pdf");
  const warnings: string[] = [];

  const pdf = await convert(Buffer.from(input.bytes), {
    onWarning: (message: string) => {
      if (message) {
        warnings.push(message);
      }
    },
  });

  return { pdfBytes: new Uint8Array(pdf), warnings };
}

/** Lightweight page estimate for freshly generated PDFs (no pdfjs worker on server). */
export async function countPdfPagesFromBytes(pdfBytes: Uint8Array): Promise<number> {
  const text = Buffer.from(pdfBytes).toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return matches?.length ?? 0;
}
