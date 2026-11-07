/**
 * AI Color Harmony Engine
 * Ekstraksi pigmen alami produk kuliner untuk menghasilkan palet warna
 * harmonis secara dinamis (Dominant, Accent, Background Tint).
 */

export interface ColorPalette {
  dominant: string;    // HEX warna produk paling dominan (cth: merah cabai #DC2626)
  accent: string;      // HEX warna aksen kontras (cth: emas rempah #F59E0B)
  background: string;  // HEX latar belakang bernuansa lembut
  textColor: string;   // HEX kontras '#FFFFFF' atau '#1E293B'
}

/**
 * Konversi nilai RGB ke format string HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Menghitung tingkat kecerahan warna (Luminance)
 * untuk menentukan apakah teks harus berwarna putih atau gelap
 */
export function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;

  // Formula perceptual luminance standar WCAG
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1E293B" : "#FFFFFF";
}

/**
 * Ekstraksi palet warna alami langsung dari elemen HTMLImageElement
 * Menggunakan teknik sampling piksel & kuantisasi pada HTML5 Canvas (Nol Library Luar).
 */
export function extractColorsFromImageElement(
  imgElement: HTMLImageElement,
  sampleStep: number = 4
): ColorPalette {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const width = Math.min(imgElement.naturalWidth || 200, 200);
  const height = Math.min(imgElement.naturalHeight || 200, 200);

  canvas.width = width;
  canvas.height = height;

  if (!ctx) {
    return {
      dominant: "#2563EB",
      accent: "#F59E0B",
      background: "#EFF6FF",
      textColor: "#FFFFFF",
    };
  }

  ctx.drawImage(imgElement, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height).data;

  // Histogram warna terkuantisasi (box 16x16x16)
  const colorBuckets: { [key: string]: { r: number; g: number; b: number; count: number } } = {};

  for (let i = 0; i < imageData.length; i += 4 * sampleStep) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];

    // Abaikan piksel transparan atau mendekati putih/hitam ekstrem
    if (a < 128) continue;
    if (r > 245 && g > 245 && b > 245) continue; // putih
    if (r < 15 && g < 15 && b < 15) continue;     // hitam

    // Kuantisasi ke kelipatan 16
    const qr = Math.floor(r / 16) * 16;
    const qg = Math.floor(g / 16) * 16;
    const qb = Math.floor(b / 16) * 16;
    const key = `${qr},${qg},${qb}`;

    if (!colorBuckets[key]) {
      colorBuckets[key] = { r, g, b, count: 0 };
    }
    colorBuckets[key].count++;
  }

  // Urutkan berdasarkan frekuensi kemunculan terbanyak
  const sorted = Object.values(colorBuckets).sort((a, b) => b.count - a.count);

  if (sorted.length === 0) {
    return {
      dominant: "#DC2626", // Merah khas cabai
      accent: "#F59E0B",   // Kuning rempah
      background: "#FEF2F2",
      textColor: "#FFFFFF",
    };
  }

  const topColor = sorted[0];
  const dominant = rgbToHex(topColor.r, topColor.g, topColor.b);

  // Cari warna aksen yang memiliki kontras/perbedaan cukup tinggi dari warna dominan
  let accentColor = sorted.find((c) => {
    const diff = Math.abs(c.r - topColor.r) + Math.abs(c.g - topColor.g) + Math.abs(c.b - topColor.b);
    return diff > 100;
  });

  if (!accentColor && sorted.length > 1) {
    accentColor = sorted[1];
  }

  const accent = accentColor ? rgbToHex(accentColor.r, accentColor.g, accentColor.b) : "#F59E0B";

  // Warna latar belakang bernuansa pastel dari warna dominan
  const bgR = Math.min(255, Math.floor(topColor.r * 0.15 + 240));
  const bgG = Math.min(255, Math.floor(topColor.g * 0.15 + 240));
  const bgB = Math.min(255, Math.floor(topColor.b * 0.15 + 240));
  const background = rgbToHex(bgR, bgG, bgB);

  return {
    dominant,
    accent,
    background,
    textColor: getContrastTextColor(dominant),
  };
}

