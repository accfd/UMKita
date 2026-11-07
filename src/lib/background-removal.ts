/** Client-side background removal with an on-device segmentation model. */

export interface ProcessedImageResult {
  previewUrl: string;
  blob: Blob;
  isCutout: boolean;
  base64: string;
}

export function fileToBase64(file: File): Promise<string> {
  return blobToBase64(file);
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error("Gagal membaca gambar."));
    reader.readAsDataURL(blob);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gagal memuat gambar produk."));
    image.src = src;
  });
}

/**
 * Plastic packaging is a difficult case for segmentation models. A failed mask
 * often leaves only the label/logo, which would make a product vanish in the
 * poster. Reject those masks and retain the original photo instead.
 */
async function hasUsableProductBounds(blob: Blob): Promise<boolean> {
  const src = URL.createObjectURL(blob);
  try {
    const image = await loadImage(src);
    const longestSide = 1024;
    const scale = Math.min(1, longestSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return false;
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (pixels[(y * width + x) * 4 + 3] > 30) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxX < 0 || maxY < 0) return false;
    const subjectWidth = (maxX - minX + 1) / width;
    const subjectHeight = (maxY - minY + 1) / height;
    // The local model is reliable for a single upright package, but not for a
    // plated meal / wide food scene. In the latter case it commonly leaves
    // ragged crumbs and partial dishes. Prefer the clean framed-photo mode to
    // presenting a visibly broken "cutout" as if it had succeeded.
    const subjectAspect = subjectWidth / subjectHeight;
    return subjectHeight >= 0.52 && subjectWidth >= 0.12 && subjectAspect <= 0.82;
  } finally {
    URL.revokeObjectURL(src);
  }
}

/** A safe fallback that preserves the original image instead of damaging its edges. */
export async function createFramedFallbackImage(imgElement: HTMLImageElement): Promise<ProcessedImageResult> {
  const canvas = document.createElement("canvas");
  const width = 720;
  const height = 900;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Gagal menginisialisasi canvas.");

  context.fillStyle = "#111827";
  context.fillRect(0, 0, width, height);
  const padding = 22;
  const radius = 48;
  context.save();
  context.beginPath();
  context.roundRect(padding, padding, width - padding * 2, height - padding * 2, radius);
  context.clip();
  const ratio = Math.max((width - padding * 2) / imgElement.naturalWidth, (height - padding * 2) / imgElement.naturalHeight);
  const imageWidth = imgElement.naturalWidth * ratio;
  const imageHeight = imgElement.naturalHeight * ratio;
  context.drawImage(imgElement, (canvas.width - imageWidth) / 2, (canvas.height - imageHeight) / 2, imageWidth, imageHeight);
  context.restore();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Gagal membuat fallback gambar."))), "image/png")
  );
  return { previewUrl: URL.createObjectURL(blob), blob, isCutout: false, base64: await blobToBase64(blob) };
}

/**
 * Uses IMG.LY's WASM/ONNX foreground model. The previous colour-threshold
 * algorithm erased transparent packaging and snack details, so it is no longer
 * used as a fallback.
 */
export async function removeProductBackground(
  imageSource: string | File | Blob,
  onProgress?: (progressPercent: number) => void
): Promise<ProcessedImageResult> {
  onProgress?.(5);
  const source = typeof imageSource === "string" ? imageSource : URL.createObjectURL(imageSource);

  try {
    const { removeBackground } = await import("@imgly/background-removal");
    const blob = await removeBackground(source, {
      device: "cpu",
      model: "isnet",
      output: { format: "image/png", quality: 1 },
      progress: (_asset, current, total) => {
        if (total > 0) onProgress?.(Math.min(90, 10 + Math.round((current / total) * 80)));
      },
    });
    if (!(await hasUsableProductBounds(blob))) {
      throw new Error("Mask penghapus latar tidak menangkap produk secara utuh.");
    }
    onProgress?.(100);
    return { previewUrl: URL.createObjectURL(blob), blob, isCutout: true, base64: await blobToBase64(blob) };
  } catch (error) {
    console.warn("[Background Removal] Model gagal dimuat; memakai foto asli berbingkai.", error);
    const image = await loadImage(source);
    onProgress?.(100);
    return createFramedFallbackImage(image);
  } finally {
    if (typeof imageSource !== "string") URL.revokeObjectURL(source);
  }
}
