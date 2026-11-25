import "server-only";

import path from "node:path";

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
 * Server-side PPTX→PDF via LibreOffice WASM (local/dev fallback).
 * Production admin UI converts in the browser first to avoid Vercel limits.
 */
export async function convertPptxToPdf(input: {
  bytes: Uint8Array;
  fileName: string;
}): Promise<{ pdfBytes: Uint8Array; warnings: string[] }> {
  const { convertDocument } = await import("@matbee/libreoffice-converter");
  const wasmPath = path.join(
    process.cwd(),
    "node_modules",
    "@matbee",
    "libreoffice-converter",
    "wasm",
  );

  const result = await convertDocument(
    input.bytes,
    { outputFormat: "pdf" },
    { wasmPath },
  );

  return {
    pdfBytes: new Uint8Array(result.data),
    warnings: [],
  };
}

/** Lightweight page estimate for freshly generated PDFs. */
export async function countPdfPagesFromBytes(pdfBytes: Uint8Array): Promise<number> {
  const text = Buffer.from(pdfBytes).toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return matches?.length ?? 0;
}
