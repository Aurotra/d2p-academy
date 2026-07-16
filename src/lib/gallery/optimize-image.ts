/** Client-side gallery image optimization: WebP display + thumbnail. */

export interface OptimizedGalleryImages {
  display: File;
  thumb: File;
  baseName: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel okunamadı."));
    };
    image.src = url;
  });
}

function canvasToWebpFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  quality: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("WebP dönüşümü başarısız."));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/webp" }));
      },
      "image/webp",
      quality,
    );
  });
}

function drawScaled(image: HTMLImageElement, maxWidth: number): HTMLCanvasElement {
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas desteklenmiyor.");
  }
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

export async function optimizeGalleryImage(file: File): Promise<OptimizedGalleryImages> {
  const image = await loadImage(file);
  const stamp = Date.now();
  const safeBase =
    file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40) || "photo";

  const displayCanvas = drawScaled(image, 1920);
  const thumbCanvas = drawScaled(image, 400);

  const display = await canvasToWebpFile(displayCanvas, `${stamp}-${safeBase}.webp`, 0.82);
  const thumb = await canvasToWebpFile(thumbCanvas, `${stamp}-${safeBase}-thumb.webp`, 0.75);

  return { display, thumb, baseName: safeBase };
}
