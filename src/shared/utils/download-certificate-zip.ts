import JSZip from "jszip";

interface CertificateZipEntry {
  fileName: string;
  pdfUrl: string;
}

function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, " ").trim();
}

export async function downloadCertificatesZip(
  entries: CertificateZipEntry[],
  zipFileName: string,
): Promise<void> {
  if (entries.length === 0) {
    throw new Error("İndirilecek PDF bulunamadı.");
  }

  const zip = new JSZip();

  await Promise.all(
    entries.map(async (entry) => {
      const response = await fetch(entry.pdfUrl);
      if (!response.ok) {
        throw new Error(`${entry.fileName} indirilemedi.`);
      }
      const blob = await response.blob();
      zip.file(entry.fileName, blob);
    }),
  );

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(zipBlob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = sanitizeFileName(zipFileName);
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
