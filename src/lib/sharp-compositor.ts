import sharp from "sharp";

export interface PosterCompositionOptions {
  productImageBuffer: Buffer;
  backdropBuffer?: Buffer; // Custom AI-generated background (e.g. from ComfyUI)
  /** Render only the visual stage plus product; used as ComfyUI img2img reference. */
  skipOverlay?: boolean;
  /** Keep an already-rendered AI product stage and add only accurate typography. */
  skipProduct?: boolean;
  isCutout?: boolean;
  productName: string;
  price?: number | string;
  headline?: string;
  brandName?: string;
  presetStyle?: string; // "tradisional" | "klasik" | "modern" | "minimalis" | "ceria" | "natural"
  primaryColor?: string;
  secondaryColor?: string;
  showPriceBadge?: boolean;
  promoBadgeText?: string;
  format?: "feed_4_5" | "story_9_16" | "feed_1_1";
  showHalalStamp?: boolean;
}

function formatPrice(val?: number | string): string {
  if (!val) return "Rp 25.000";
  const num = typeof val === "string" ? parseFloat(val.replace(/[^0-9]/g, "")) : val;
  if (isNaN(num)) return String(val);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

type PosterStyle = {
  headlineFont: string;
  headlineColor: string;
  accentColor: string;
  inkColor: string;
  titleX: number;
  titleY: number;
  productX: number;
  productFloor: number;
  productWidth: number;
  productHeight: number;
  headlineSize: number;
  badgeRadius: number;
};

// The layout data is intentionally different per style. A style must change
// hierarchy and placement, not only replace the background colour.
const POSTER_STYLES: Record<string, PosterStyle> = {
  // Hero layout: deliberately mirrors the high-end Minang ad structure —
  // oversized editorial title on the left and one unframed product hero on
  // the right. This is not a recoloured version of the other layouts.
  tradisional: { headlineFont: "Georgia, serif", headlineColor: "#FFFBEB", accentColor: "#F4C766", inkColor: "#4A2415", titleX: 62, titleY: 170, productX: 0.77, productFloor: 0.95, productWidth: 650, productHeight: 1120, headlineSize: 152, badgeRadius: 28 },
  klasik: { headlineFont: "Georgia, serif", headlineColor: "#30221B", accentColor: "#873B32", inkColor: "#4B2E20", titleX: 62, titleY: 155, productX: 0.73, productFloor: 0.93, productWidth: 590, productHeight: 880, headlineSize: 100, badgeRadius: 4 },
  modern: { headlineFont: "Arial, sans-serif", headlineColor: "#16466C", accentColor: "#FFC64A", inkColor: "#16466C", titleX: 58, titleY: 160, productX: 0.75, productFloor: 0.93, productWidth: 630, productHeight: 900, headlineSize: 98, badgeRadius: 30 },
  minimalis: { headlineFont: "Arial, sans-serif", headlineColor: "#30343B", accentColor: "#D9A72E", inkColor: "#30343B", titleX: 64, titleY: 145, productX: 0.72, productFloor: 0.93, productWidth: 640, productHeight: 910, headlineSize: 94, badgeRadius: 8 },
  ceria: { headlineFont: "Arial Black, Arial, sans-serif", headlineColor: "#FFFFFF", accentColor: "#FFD52E", inkColor: "#391B15", titleX: 54, titleY: 165, productX: 0.75, productFloor: 0.94, productWidth: 650, productHeight: 920, headlineSize: 112, badgeRadius: 26 },
  natural: { headlineFont: "Georgia, serif", headlineColor: "#365B38", accentColor: "#788B45", inkColor: "#365B38", titleX: 62, titleY: 165, productX: 0.74, productFloor: 0.94, productWidth: 610, productHeight: 900, headlineSize: 104, badgeRadius: 18 },
};

/**
 * Panggung Studio Fotografi Bersih (Pristine Commercial Photography Stage)
 * Menghasilkan latar studio profesional fotorealistik sesuai gaya tema,
 * TANPA mencemari kanvas dengan gambar produk atau teks lama!
 */
export function renderStudioStageSvg(width: number, height: number, styleKey: string): string {
  if (styleKey === "klasik") {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vintagePaper" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FBF7EE" />
            <stop offset="60%" stop-color="#EEDCBF" />
            <stop offset="100%" stop-color="#D9C29A" />
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stop-color="#000000" stop-opacity="0.0" />
            <stop offset="100%" stop-color="#451A03" stop-opacity="0.30" />
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#vintagePaper)" />
        <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="#78350F" stroke-width="2" stroke-dasharray="8,6" opacity="0.6" />
        <polygon points="0,${Math.round(height * 0.68)} ${width},${Math.round(height * 0.68)} ${width},${height} 0,${height}" fill="#78350F" opacity="0.25" />
        <rect width="${width}" height="${height}" fill="url(#vignette)" />
      </svg>
    `;
  }

  if (styleKey === "modern") {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="modernSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#BAE6FD" />
            <stop offset="60%" stop-color="#E0F2FE" />
            <stop offset="100%" stop-color="#FEF08A" />
          </linearGradient>
          <radialGradient id="podiumGlow" cx="70%" cy="75%" r="40%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7" />
            <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.0" />
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#modernSky)" />
        <ellipse cx="${Math.round(width * 0.70)}" cy="${Math.round(height * 0.85)}" rx="260" ry="70" fill="#0284C7" opacity="0.18" />
        <ellipse cx="${Math.round(width * 0.70)}" cy="${Math.round(height * 0.84)}" rx="240" ry="60" fill="#FFFFFF" />
        <rect width="${width}" height="${height}" fill="url(#podiumGlow)" />
      </svg>
    `;
  }

  if (styleKey === "ceria") {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="spicyFire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#EA580C" />
            <stop offset="45%" stop-color="#DC2626" />
            <stop offset="100%" stop-color="#991B1B" />
          </linearGradient>
          <radialGradient id="sunburstYellow" cx="70%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#FDE047" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.0" />
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#spicyFire)" />
        <rect width="${width}" height="${height}" fill="url(#sunburstYellow)" />
        <ellipse cx="${Math.round(width * 0.70)}" cy="${Math.round(height * 0.86)}" rx="260" ry="50" fill="#7F1D1D" opacity="0.6" />
      </svg>
    `;
  }

  if (styleKey === "minimalis") {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="#F7F7F5"/><rect x="0" y="${Math.round(height * .74)}" width="${width}" height="${Math.round(height * .26)}" fill="#EEEDE8"/><ellipse cx="${Math.round(width*.72)}" cy="${Math.round(height*.84)}" rx="250" ry="38" fill="#CBD0D3" opacity=".42"/></svg>`;
  }

  if (styleKey === "natural") {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="n" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F3EBDD"/><stop offset="1" stop-color="#D7C4A3"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#n)"/><path d="M0 ${height} L0 ${Math.round(height*.65)} Q160 ${Math.round(height*.57)} 300 ${height}Z" fill="#788B45" opacity=".18"/><circle cx="${width-65}" cy="105" r="90" fill="#A8B69A" opacity=".35"/></svg>`;
  }

  // Default: Tradisional & Elegan (Mahogany wood wall, warm ambient spotlight, rustic wood table, Minang songket)
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wallDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1A0B05" />
          <stop offset="40%" stop-color="#2D150B" />
          <stop offset="100%" stop-color="#120603" />
        </linearGradient>
        <linearGradient id="tableWood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#4E2713" />
          <stop offset="20%" stop-color="#5E311A" />
          <stop offset="60%" stop-color="#3D1D0D" />
          <stop offset="100%" stop-color="#241006" />
        </linearGradient>
        <radialGradient id="spotLight" cx="72%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#FFA726" stop-opacity="0.32" />
          <stop offset="45%" stop-color="#D84315" stop-opacity="0.14" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.0" />
        </radialGradient>
        <linearGradient id="songketCloth" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#991B1B" />
          <stop offset="50%" stop-color="#7F1D1D" />
          <stop offset="100%" stop-color="#450A0A" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#wallDark)" />
      <polygon points="0,${Math.round(height * 0.68)} ${width},${Math.round(height * 0.68)} ${width},${height} 0,${height}" fill="url(#tableWood)" />
      <line x1="0" y1="${Math.round(height * 0.68)}" x2="${width}" y2="${Math.round(height * 0.68)}" stroke="#8D4C27" stroke-width="2.5" opacity="0.9" />
      <line x1="0" y1="${Math.round(height * 0.68) + 2}" x2="${width}" y2="${Math.round(height * 0.68) + 2}" stroke="#0F0603" stroke-width="2" opacity="0.9" />
      <path d="M 0,${Math.round(height * 0.72)} L 360,${Math.round(height * 0.68)} L 300,${height} L 0,${height} Z" fill="url(#songketCloth)" opacity="0.92" />
      <path d="M 0,${Math.round(height * 0.74)} L 340,${Math.round(height * 0.70)} M 0,${Math.round(height * 0.78)} L 330,${Math.round(height * 0.74)} M 0,${Math.round(height * 0.82)} L 320,${Math.round(height * 0.78)} M 0,${Math.round(height * 0.86)} L 310,${Math.round(height * 0.82)} M 0,${Math.round(height * 0.90)} L 300,${Math.round(height * 0.86)}" stroke="#F59E0B" stroke-width="2" stroke-dasharray="6,6" opacity="0.65" />
      <rect width="${width}" height="${height}" fill="url(#spotLight)" />
    </svg>
  `;
}

/**
 * Mesin Kompositor Poster Fotorealistik Cerdas UMKita
 * Menggabungkan FOTO PRODUK ASLI PENGGUNA dengan LATAR FOTOGRAFI KOMERSIAL OTENTIK
 */
export async function composePosterImage(options: PosterCompositionOptions): Promise<Buffer> {
  const format = options.format || "feed_1_1";
  let WIDTH = 1080;
  let HEIGHT = 1080; // Standar Feed Instagram 1:1

  if (format === "story_9_16") {
    WIDTH = 1080;
    HEIGHT = 1920;
  } else if (format === "feed_4_5") {
    WIDTH = 1080;
    HEIGHT = 1350;
  }

  // Normalisasi presetStyle
  let styleKey = (options.presetStyle || "tradisional").toLowerCase();
  if (styleKey === "rustic_minang") styleKey = "tradisional";
  if (styleKey === "vintage" || styleKey === "nostalgia_vintage") styleKey = "klasik";
  if (styleKey === "claymorphism") styleKey = "modern";
  if (styleKey === "clean" || styleKey === "editorial") styleKey = "minimalis";
  if (styleKey === "bold_promo" || styleKey === "bold_punch_promo") styleKey = "ceria";
  const style = POSTER_STYLES[styleKey] || POSTER_STYLES.tradisional;

  const rawProductName = options.productName || "Kripik Balado Sanjai Nafama";
  const brandName = (options.brandName || "SANJAI NAFAMA").toUpperCase();
  const headline = options.headline || "Camilan Renyah Khas Minang";
  const formattedPrice = formatPrice(options.price);
  const showPrice = options.showPriceBadge ?? true;
  const promoText = options.promoBadgeText || "Hemat 20%";
  const showHalal = options.showHalalStamp ?? true;

  // 1. Siapkan Latar Belakang Panggung Fotorealistik Komersial
  let backdropBuffer: Buffer;
  if (options.backdropBuffer && Buffer.isBuffer(options.backdropBuffer) && options.backdropBuffer.length > 1000) {
    backdropBuffer = await sharp(options.backdropBuffer).resize(WIDTH, HEIGHT, { fit: "cover" }).toBuffer();
  } else {
    const backdropSvg = renderStudioStageSvg(WIDTH, HEIGHT, styleKey);
    backdropBuffer = await sharp(Buffer.from(backdropSvg)).png().toBuffer();
  }

  // 2. Siapkan Foto Produk Asli Pengguna (Heroic Scale)
  let targetProductWidth = style.productWidth;
  let targetProductHeight = style.productHeight;
  if (format === "story_9_16") {
    targetProductWidth = 540;
    targetProductHeight = 820;
  }

  let processedProduct: Buffer;

  // Cek apakah buffer memiliki transparansi atau isCutout
  const inputMeta = await sharp(options.productImageBuffer).metadata();
  const hasCutout = options.isCutout || inputMeta.hasAlpha;

  if (hasCutout) {
    processedProduct = await sharp(options.productImageBuffer)
      // Hasil penghapus latar mempertahankan ukuran kanvas foto semula. Trim
      // transparansi agar produk aktual, bukan area kosong, yang diperbesar.
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
      .resize(targetProductWidth, targetProductHeight, {
        fit: "inside",
        withoutEnlargement: false,
      })
      .toFormat("png")
      .toBuffer();
  } else {
    // Mode Foto Asli Berbingkai Elegan (Heroic Portrait Card)
    const frameW = targetProductWidth;
    const frameH = Math.round(targetProductWidth * 1.35); // 460 x 620 px
    const resized = await sharp(options.productImageBuffer)
      .resize(frameW, frameH, { fit: "cover" })
      .toBuffer();

    const roundedMask = Buffer.from(`
      <svg width="${frameW}" height="${frameH}">
        <rect x="0" y="0" width="${frameW}" height="${frameH}" rx="32" ry="32" fill="#fff"/>
      </svg>
    `);

    processedProduct = await sharp(resized)
      .composite([{ input: roundedMask, blend: "dest-in" }])
      .png()
      .toBuffer();
  }

  const productMeta = await sharp(processedProduct).metadata();
  const prodWidth = productMeta.width || targetProductWidth;
  const prodHeight = productMeta.height || targetProductHeight;

  let productLeft = Math.round(WIDTH * style.productX - prodWidth / 2);
  let productTop = Math.round(HEIGHT * style.productFloor - prodHeight);

  if (format === "story_9_16") {
    productLeft = Math.round((WIDTH - prodWidth) / 2);
    productTop = Math.round(HEIGHT * 0.56 - prodHeight / 2);
  }

  const brandDecoration =
    styleKey === "tradisional"
      ? `<g filter="url(#badgeShadow)"><path d="M0,0 L360,0 C330,55 290,95 240,115 C180,135 110,140 0,140 Z" fill="#7F1D1D"/><path d="M0,135 C105,135 175,130 234,110 C283,90 322,52 352,0" stroke="#F4C766" stroke-width="3.5" fill="none"/><text x="55" y="75" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#FEF3C7" letter-spacing="2">${brandName}</text></g>`
      : styleKey === "klasik"
      ? `<g transform="translate(58,48)"><rect width="250" height="58" rx="3" fill="#E8D3AD" stroke="#873B32" stroke-width="3"/><text x="125" y="36" font-family="Georgia,serif" font-size="17" font-weight="bold" fill="#4B2E20" text-anchor="middle" letter-spacing="2">${brandName}</text></g>`
      : styleKey === "modern"
      ? `<g transform="translate(58,52)"><rect width="230" height="54" rx="27" fill="#16466C"/><circle cx="31" cy="27" r="14" fill="#FFC64A"/><text x="128" y="34" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${brandName}</text></g>`
      : styleKey === "minimalis"
      ? `<g transform="translate(64,62)"><text x="0" y="0" font-family="Arial,sans-serif" font-size="15" font-weight="bold" fill="#30343B" letter-spacing="3">${brandName}</text><line x1="0" y1="17" x2="245" y2="17" stroke="#D9A72E" stroke-width="3"/></g>`
      : styleKey === "ceria"
      ? `<g transform="translate(50,45)"><path d="M55 0 L66 28 L96 19 L78 45 L102 63 L70 62 L64 94 L48 65 L20 82 L33 52 L0 38 L35 31 Z" fill="#FFD52E"/><text x="52" y="51" font-family="Arial Black,Arial" font-size="11" fill="#A90F18" text-anchor="middle">${brandName}</text></g>`
      : `<g transform="translate(58,48)"><rect width="240" height="56" rx="28" fill="#F3EBDD"/><path d="M25 30 Q38 5 51 30 Q38 48 25 30" fill="#788B45"/><text x="142" y="35" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#365B38" text-anchor="middle">${brandName}</text></g>`;

  // Pisahkan nama produk menjadi 2 baris untuk tipografi editorial
  const words = rawProductName.split(" ");
  let line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  let line2 = words.slice(Math.ceil(words.length / 2)).join(" ");
  if (!line2) {
    line1 = rawProductName;
    line2 = "";
  }
  const headlineLineOneY = style.headlineSize;
  const headlineLineTwoY = style.headlineSize * 2 - 4;
  const isTraditionalHero = styleKey === "tradisional";
  const subtitleY = line2 ? headlineLineTwoY + (isTraditionalHero ? 68 : 58) : headlineLineOneY + 54;
  const featuresY = subtitleY + (isTraditionalHero ? 74 : 58);
  const priceY = featuresY + (isTraditionalHero ? 172 : 148);
  const featureSize = isTraditionalHero ? 128 : 108;
  const featureGap = isTraditionalHero ? 146 : 126;
  const featureIconSize = isTraditionalHero ? 38 : 34;
  const featureCopySize = isTraditionalHero ? 17 : 15;

  // 3. Susun Lapisan Tipografi & Elemen Grafis Desain Komersial (SVG Overlay)
  const subjectShadowSvg = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="productShadow" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="16" /></filter></defs>
      <ellipse cx="${productLeft + prodWidth / 2}" cy="${productTop + prodHeight - 4}" rx="${prodWidth * 0.44}" ry="24" fill="#000000" opacity="0.56" filter="url(#productShadow)" />
      <ellipse cx="${productLeft + prodWidth / 2}" cy="${productTop + prodHeight - 4}" rx="${prodWidth * 0.26}" ry="10" fill="#000000" opacity="0.62" />
    </svg>
  `);

  const svgOverlayContent = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Red & Gold Minang Banner Gradient -->
        <linearGradient id="minangRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#991B1B" />
          <stop offset="60%" stop-color="#7F1D1D" />
          <stop offset="100%" stop-color="#450A0A" />
        </linearGradient>

        <linearGradient id="goldSheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FEF08A" />
          <stop offset="50%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>

        <!-- Drop Shadow Filters -->
        <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.6" />
        </filter>
        <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.75" />
        </filter>
      </defs>

      ${brandDecoration}

      <!-- TOP-RIGHT: Promo Badge -->
      <g transform="translate(${WIDTH - 210}, 45)" filter="url(#badgeShadow)">
        <rect width="160" height="44" rx="${style.badgeRadius}" fill="${styleKey === "ceria" ? "#FFD52E" : style.accentColor}" />
        <text x="80" y="27" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">
          ★ ${promoText.toUpperCase()}
        </text>
      </g>

      <!-- HEADLINE & BADGES -->
      <g transform="translate(${style.titleX}, ${style.titleY})" filter="url(#textGlow)">
        <!-- Line 1 Title (Serif Italic) -->
        <text x="0" y="${headlineLineOneY}" font-family="${style.headlineFont}" font-size="${style.headlineSize}" font-weight="bold" ${styleKey === "tradisional" || styleKey === "klasik" ? 'font-style="italic"' : ""} fill="${style.headlineColor}">
          ${line1}
        </text>

        ${
          line2
            ? `
        <text x="0" y="${headlineLineTwoY}" font-family="${style.headlineFont}" font-size="${style.headlineSize}" font-weight="bold" ${styleKey === "tradisional" || styleKey === "klasik" ? 'font-style="italic"' : ""} fill="${style.accentColor}">
          ${line2}
        </text>
        `
            : ""
        }

        <!-- Subtitle -->
        <text x="0" y="${subtitleY}" font-family="Arial, sans-serif" font-size="${isTraditionalHero ? 39 : 34}" font-weight="700" fill="${styleKey === "minimalis" || styleKey === "natural" ? style.inkColor : "#FDE68A"}" letter-spacing="0.5">
          ${headline}
        </text>

        <!-- 3 Feature Badges -->
        <g transform="translate(0, ${featuresY})">
          <!-- Badge 1: Rasa Asli -->
          <g transform="translate(0, 0)" filter="url(#badgeShadow)">
            <rect width="${featureSize}" height="${featureSize}" rx="${style.badgeRadius}" fill="${styleKey === "minimalis" ? "#FFFFFF" : "#FFFDF8"}" />
            <text x="${featureSize / 2}" y="${isTraditionalHero ? 57 : 49}" font-size="${featureIconSize}" text-anchor="middle">🌿</text>
            <text x="${featureSize / 2}" y="${isTraditionalHero ? 93 : 79}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${featureCopySize}" font-weight="800" fill="#292524" text-anchor="middle">
              Rasa Asli
            </text>
          </g>

          <!-- Badge 2: Renyah & Gurih -->
          <g transform="translate(${featureGap}, 0)" filter="url(#badgeShadow)">
            <rect width="${featureSize}" height="${featureSize}" rx="${style.badgeRadius}" fill="${styleKey === "minimalis" ? "#FFFFFF" : "#FFFDF8"}" />
            <text x="${featureSize / 2}" y="${isTraditionalHero ? 55 : 47}" font-size="${isTraditionalHero ? 36 : 32}" text-anchor="middle">🥞</text>
            <text x="${featureSize / 2}" y="${isTraditionalHero ? 87 : 74}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${isTraditionalHero ? 16 : 14}" font-weight="800" fill="#292524" text-anchor="middle">
              Renyah
            </text>
            <text x="${featureSize / 2}" y="${isTraditionalHero ? 106 : 91}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${isTraditionalHero ? 16 : 14}" font-weight="800" fill="#292524" text-anchor="middle">
              &amp; Gurih
            </text>
          </g>

          <!-- Badge 3: Tanpa Pengawet -->
          <g transform="translate(${featureGap * 2}, 0)" filter="url(#badgeShadow)">
            <rect width="${featureSize}" height="${featureSize}" rx="${style.badgeRadius}" fill="${styleKey === "minimalis" ? "#FFFFFF" : "#FFFDF8"}" />
            <text x="${featureSize / 2}" y="${isTraditionalHero ? 55 : 47}" font-size="${isTraditionalHero ? 36 : 32}" text-anchor="middle">🛡️</text>
            <text x="${featureSize / 2}" y="${isTraditionalHero ? 87 : 74}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${isTraditionalHero ? 16 : 14}" font-weight="800" fill="#292524" text-anchor="middle">
              Tanpa
            </text>
            <text x="${featureSize / 2}" y="${isTraditionalHero ? 106 : 91}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${isTraditionalHero ? 16 : 14}" font-weight="800" fill="#292524" text-anchor="middle">
              Pengawet
            </text>
          </g>
        </g>

        <!-- Price Tag & Halal Row -->
        <g transform="translate(0, ${priceY})">
          ${
            showPrice
              ? `
          <g filter="url(#badgeShadow)">
            <rect width="${isTraditionalHero ? 286 : 240}" height="${isTraditionalHero ? 70 : 60}" rx="${style.badgeRadius}" fill="${style.accentColor}" />
            <text x="${isTraditionalHero ? 143 : 120}" y="${isTraditionalHero ? 45 : 38}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${isTraditionalHero ? 24 : 20}" font-weight="900" fill="#1C1917" text-anchor="middle">
              🏷️ ${formattedPrice} / bks
            </text>
          </g>
          `
              : ""
          }

          ${
            showHalal
              ? `
          <g transform="translate(${showPrice ? (isTraditionalHero ? 304 : 258) : 0}, 0)" filter="url(#badgeShadow)">
            <rect width="${isTraditionalHero ? 154 : 136}" height="${isTraditionalHero ? 70 : 60}" rx="30" fill="#15803D" />
            <text x="${isTraditionalHero ? 77 : 68}" y="${isTraditionalHero ? 44 : 38}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${isTraditionalHero ? 16 : 14}" font-weight="800" fill="#FFFFFF" text-anchor="middle">
              ✓ HALAL RI
            </text>
          </g>
          `
              : ""
          }
        </g>
      </g>

    </svg>
  `;

  const svgBuf = Buffer.from(svgOverlayContent);

  // 4. Komposisikan: Latar Panggung + Foto Produk + Tipografi
  const composites: sharp.OverlayOptions[] = [];
  if (!options.skipProduct) {
    composites.push({ input: subjectShadowSvg, left: 0, top: 0 });
    composites.push({ input: processedProduct, left: productLeft, top: productTop });
  }
  if (!options.skipOverlay) composites.push({ input: svgBuf, left: 0, top: 0 });

  const finalImage = await sharp(backdropBuffer)
    .composite(composites)
    .png({ quality: 95 })
    .toBuffer();

  return finalImage;
}
