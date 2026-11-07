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
  marketingGoal?: string; // "promo_diskon" | "produk_baru" | "oleh_oleh" | "kualitas"
  targetAudience?: string; // "wisatawan" | "anak_muda" | "keluarga" | "pecinta_pedas"
  advantages?: string;
  category?: string;
  variationIndex?: number;
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

function escapeXml(unsafe?: string): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function pickIconForText(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("alami") || t.includes("daun") || t.includes("organik")) return "🌿";
  if (t.includes("renyah") || t.includes("kriuk") || t.includes("gurih")) return "🥞";
  if (t.includes("pengawet") || t.includes("pewarna") || t.includes("kimia") || t.includes("sehat")) return "🛡️";
  if (t.includes("pedas") || t.includes("cabai") || t.includes("balado") || t.includes("api")) return "🌶️";
  if (t.includes("bulan") || t.includes("tahan") || t.includes("lama") || t.includes("awet")) return "⏳";
  if (t.includes("kemas") || t.includes("kirim") || t.includes("paket") || t.includes("rapi")) return "📦";
  if (t.includes("diskon") || t.includes("promo") || t.includes("hemat") || t.includes("murah")) return "🏷️";
  if (t.includes("minang") || t.includes("asli") || t.includes("otentik") || t.includes("tradisi")) return "⭐";
  if (t.includes("fresh") || t.includes("baru") || t.includes("oven")) return "✨";
  if (t.includes("halal") || t.includes("mui") || t.includes("higienis")) return "✓";
  return "✨";
}

function cleanBadgeTitle(raw: string): { line1: string; line2: string } {
  const cleaned = raw.replace(/^[-*•\d.]+\s*/, "").trim();
  const words = cleaned.split(/\s+/);
  if (words.length <= 2) {
    return { line1: words[0] || "Pilihan", line2: words[1] || "" };
  }
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(" "),
    line2: words.slice(mid).join(" "),
  };
}

interface SmartBadge {
  icon: string;
  line1: string;
  line2: string;
}

function getSmartBadges(
  advantages?: string,
  goal?: string,
  audience?: string,
  variation: number = 0
): SmartBadge[] {
  if (advantages && advantages.length > 5) {
    const parts = advantages
      .split(/[,;\n•]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);

    if (parts.length >= 3) {
      return [
        { icon: pickIconForText(parts[0]), ...cleanBadgeTitle(parts[0]) },
        { icon: pickIconForText(parts[1]), ...cleanBadgeTitle(parts[1]) },
        { icon: pickIconForText(parts[2]), ...cleanBadgeTitle(parts[2]) },
      ];
    }
    if (parts.length === 2) {
      return [
        { icon: pickIconForText(parts[0]), ...cleanBadgeTitle(parts[0]) },
        { icon: pickIconForText(parts[1]), ...cleanBadgeTitle(parts[1]) },
        { icon: "🛡️", line1: "Tanpa", line2: "Pengawet" },
      ];
    }
  }

  // Synthesize badges based on goal & variation
  if (goal === "promo_diskon") {
    const badgeSets: SmartBadge[][] = [
      [
        { icon: "🏷️", line1: "Diskon", line2: "Spesial" },
        { icon: "🥞", line1: "Renyah", line2: "Maksimal" },
        { icon: "⏳", line1: "Stok", line2: "Terbatas" },
      ],
      [
        { icon: "💰", line1: "Harga", line2: "Hemat" },
        { icon: "🌿", line1: "Bumbu", line2: "Alami" },
        { icon: "📦", line1: "Siap", line2: "Kirim" },
      ],
      [
        { icon: "⚡", line1: "Flash", line2: "Sale" },
        { icon: "🌶️", line1: "Rasa", line2: "Juara" },
        { icon: "🛡️", line1: "100%", line2: "Higienis" },
      ],
    ];
    return badgeSets[variation % badgeSets.length];
  }

  if (goal === "oleh_oleh") {
    const badgeSets: SmartBadge[][] = [
      [
        { icon: "🎒", line1: "Khas", line2: "Minang" },
        { icon: "⏳", line1: "Tahan", line2: "2 Bulan" },
        { icon: "📦", line1: "Kemas", line2: "Rapi" },
      ],
      [
        { icon: "✈️", line1: "Oleh-Oleh", line2: "Favorit" },
        { icon: "⭐", line1: "Resep", line2: "Autentik" },
        { icon: "🛡️", line1: "Bebas", line2: "Kimia" },
      ],
    ];
    return badgeSets[variation % badgeSets.length];
  }

  if (goal === "produk_baru") {
    const badgeSets: SmartBadge[][] = [
      [
        { icon: "✨", line1: "Varian", line2: "Terbaru" },
        { icon: "🔥", line1: "Rasa", line2: "Nagih" },
        { icon: "🌿", line1: "100%", line2: "Alami" },
      ],
      [
        { icon: "🌟", line1: "Fresh", line2: "Oven" },
        { icon: "🥞", line1: "Kriuk", line2: "Super" },
        { icon: "🛡️", line1: "Bebas", line2: "Pengawet" },
      ],
    ];
    return badgeSets[variation % badgeSets.length];
  }

  // Goal: kualitas / default
  if (audience === "anak_muda") {
    const badgeSets: SmartBadge[][] = [
      [
        { icon: "🤤", line1: "Kriuk", line2: "Nagih" },
        { icon: "🔥", line1: "Bumbu", line2: "Nendang" },
        { icon: "💸", line1: "Ramah", line2: "Kantong" },
      ],
      [
        { icon: "🎮", line1: "Teman", line2: "Nongkrong" },
        { icon: "🥞", line1: "Renyah", line2: "Maksimal" },
        { icon: "🌿", line1: "Bahan", line2: "Pilihan" },
      ],
    ];
    return badgeSets[variation % badgeSets.length];
  }

  const defaultSets: SmartBadge[][] = [
    [
      { icon: "🌿", line1: "Rasa", line2: "Asli" },
      { icon: "🥞", line1: "Renyah", line2: "dan Gurih" },
      { icon: "🛡️", line1: "Tanpa", line2: "Pengawet" },
    ],
    [
      { icon: "👑", line1: "Kualitas", line2: "Premium" },
      { icon: "🌶️", line1: "Rempah", line2: "Pilihan" },
      { icon: "⏳", line1: "Tahan", line2: "Lama" },
    ],
  ];
  return defaultSets[variation % defaultSets.length];
}

function getGoalHeaderTag(goal?: string, variation: number = 0): string {
  if (goal === "promo_diskon") {
    const tags = ["🏷️ PENAWARAN SPESIAL", "⚡ FLASH PROMO DISKON", "🔥 PROMO CUCI GUDANG"];
    return tags[variation % tags.length];
  }
  if (goal === "produk_baru") {
    const tags = ["✨ VARIAN BARU", "🚀 BARU DILUNCURKAN", "🌟 RESEP TERBAIK"];
    return tags[variation % tags.length];
  }
  if (goal === "oleh_oleh") {
    const tags = ["🎒 OLEH-OLEH KHAS MINANG", "✈️ BUAH TANGAN WISATAWAN", "📦 SIAP KIRIM SE-NUSANTARA"];
    return tags[variation % tags.length];
  }
  const tags = ["👑 KUALITAS PREMIUM", "🌿 100% BAHAN ALAMI", "⭐ MUTU ASLI MINANG"];
  return tags[variation % tags.length];
}

function getDynamicSubtitle(
  productName: string,
  goal?: string,
  audience?: string,
  variation: number = 0
): string {
  if (goal === "promo_diskon") {
    const quotes = [
      "Penawaran Spesial Hemat, Stok Terbatas Hari Ini!",
      "Nikmati Gurih Renyah Autentik dengan Harga Hemat!",
      "Camilan Favorit Lebih Hemat, Pesan Sebelum Kehabisan!",
    ];
    return quotes[variation % quotes.length];
  }
  if (goal === "oleh_oleh") {
    const quotes = [
      "Oleh-Oleh Legendaris Ranah Minang yang Selalu Bikin Rindu!",
      "Buah Tangan Asli Padang Ganting untuk Keluarga Tercinta",
      "Kelezatan Khas Nusantara yang Siap Dikirim ke Kotamu",
    ];
    return quotes[variation % quotes.length];
  }
  if (goal === "produk_baru") {
    const quotes = [
      "Inovasi Cita Rasa Minang yang Lebih Renyah & Menggoda!",
      "Sensasi Kriuk Segar Langsung dari Dapur Produksi!",
      "Varian Baru Terfavorit yang Bikin Waktu Ngemil Makin Seru!",
    ];
    return quotes[variation % quotes.length];
  }
  if (audience === "anak_muda") {
    const quotes = [
      "Fix No Debat, Kriuk Gurihnya Beneran Candu Parah!",
      "Teman Wajib Pas Nonton Drakor, Nugas & Mabar Game!",
      "Sekali Gigit Langsung Paham Kenapa Ini Camilan Favorit!",
    ];
    return quotes[variation % quotes.length];
  }
  if (audience === "keluarga") {
    const quotes = [
      "Sajian Gurih Renyah Sehat Favorit Seluruh Anggota Keluarga",
      "Kelezatan Tradisi yang Menghangatkan Waktu Santai di Rumah",
      "Camilan Tanpa Pengawet Buatan, Aman untuk Semua Generasi",
    ];
    return quotes[variation % quotes.length];
  }
  const quotes = [
    "Cita Rasa Minangkabau Legendaris yang Selalu Dirindukan",
    "Gurih Renyah Autentik dari Olahan Tradisional Pilihan",
    "Kerenyahan Alami Bumbu Rempah Khas Tanah Datar",
  ];
  return quotes[variation % quotes.length];
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

const POSTER_STYLES: Record<string, PosterStyle> = {
  tradisional: {
    headlineFont: "Georgia, serif",
    headlineColor: "#FFFBEB",
    accentColor: "#F4C766",
    inkColor: "#4A2415",
    titleX: 60,
    titleY: 155,
    productX: 0.77,
    productFloor: 0.95,
    productWidth: 650,
    productHeight: 1120,
    headlineSize: 125,
    badgeRadius: 24,
  },
  klasik: {
    headlineFont: "Georgia, serif",
    headlineColor: "#2B1810",
    accentColor: "#9A3412",
    inkColor: "#431407",
    titleX: 60,
    titleY: 150,
    productX: 0.74,
    productFloor: 0.93,
    productWidth: 600,
    productHeight: 920,
    headlineSize: 96,
    badgeRadius: 8,
  },
  modern: {
    headlineFont: "'Plus Jakarta Sans', Arial, sans-serif",
    headlineColor: "#FFFFFF",
    accentColor: "#38BDF8",
    inkColor: "#0F172A",
    titleX: 58,
    titleY: 155,
    productX: 0.75,
    productFloor: 0.93,
    productWidth: 630,
    productHeight: 900,
    headlineSize: 98,
    badgeRadius: 28,
  },
  minimalis: {
    headlineFont: "'Plus Jakarta Sans', Arial, sans-serif",
    headlineColor: "#1E293B",
    accentColor: "#D97706",
    inkColor: "#1E293B",
    titleX: 62,
    titleY: 145,
    productX: 0.73,
    productFloor: 0.93,
    productWidth: 630,
    productHeight: 910,
    headlineSize: 92,
    badgeRadius: 8,
  },
  ceria: {
    headlineFont: "Arial Black, Arial, sans-serif",
    headlineColor: "#FFFFFF",
    accentColor: "#FBBF24",
    inkColor: "#450A0A",
    titleX: 54,
    titleY: 155,
    productX: 0.75,
    productFloor: 0.94,
    productWidth: 660,
    productHeight: 940,
    headlineSize: 104,
    badgeRadius: 26,
  },
  natural: {
    headlineFont: "Georgia, serif",
    headlineColor: "#14532D",
    accentColor: "#65A30D",
    inkColor: "#14532D",
    titleX: 60,
    titleY: 155,
    productX: 0.74,
    productFloor: 0.94,
    productWidth: 610,
    productHeight: 900,
    headlineSize: 100,
    badgeRadius: 20,
  },
};

/**
 * Panggung Studio Fotografi Bersih & Otentik (Commercial Photography Stage)
 * Menghasilkan latar studio profesional fotorealistik sesuai gaya tema,
 * variasi visual, dan tujuan promosi tanpa kanvas kosong atau monoton.
 */
export function renderStudioStageSvg(
  width: number,
  height: number,
  styleKey: string,
  goal?: string,
  variation: number = 0
): string {
  if (styleKey === "klasik") {
    // Gaya Klasik: Kertas perkamen vintage bertekstur, stempel pos retro Minang, meja kayu rustic
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vintagePaper" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FBF7EE" />
            <stop offset="45%" stop-color="#F4E9D5" />
            <stop offset="100%" stop-color="#DFCCA8" />
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="55%" stop-color="#000000" stop-opacity="0.0" />
            <stop offset="100%" stop-color="#381D0B" stop-opacity="0.28" />
          </radialGradient>
          <linearGradient id="rusticWood" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#6A3B1D" />
            <stop offset="25%" stop-color="#552C14" />
            <stop offset="100%" stop-color="#341A0A" />
          </linearGradient>
        </defs>
        <!-- Background Paper -->
        <rect width="${width}" height="${height}" fill="url(#vintagePaper)" />
        
        <!-- Retro Postal Border -->
        <rect x="22" y="22" width="${width - 44}" height="${height - 44}" fill="none" stroke="#78350F" stroke-width="2.5" stroke-dasharray="10,6" opacity="0.55" />
        <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="#873B32" stroke-width="1" opacity="0.35" />

        <!-- Vintage Stamp Seal (Right Background) -->
        <g transform="translate(${width - 230}, 160)" opacity="0.45">
          <circle cx="90" cy="90" r="82" fill="none" stroke="#873B32" stroke-width="4" stroke-dasharray="8,4" />
          <circle cx="90" cy="90" r="70" fill="none" stroke="#873B32" stroke-width="1.8" />
          <path id="stampCurve" d="M 30,90 A 60,60 0 1,1 150,90" fill="none" />
          <text font-family="Georgia,serif" font-size="11" font-weight="bold" fill="#873B32" letter-spacing="2">
            <textPath href="#stampCurve" startOffset="50%" text-anchor="middle">★ WARISAN KULINER MINANG ★</textPath>
          </text>
          <text x="90" y="85" font-family="Georgia,serif" font-size="14" font-weight="bold" fill="#873B32" text-anchor="middle">PADANG GANTING</text>
          <text x="90" y="105" font-family="Georgia,serif" font-size="12" font-style="italic" fill="#873B32" text-anchor="middle">Sejak 1998</text>
        </g>

        <!-- Rustic Tabletop -->
        <polygon points="0,${Math.round(height * 0.70)} ${width},${Math.round(height * 0.70)} ${width},${height} 0,${height}" fill="url(#rusticWood)" />
        <line x1="0" y1="${Math.round(height * 0.70)}" x2="${width}" y2="${Math.round(height * 0.70)}" stroke="#9A4D22" stroke-width="3" opacity="0.7" />
        <line x1="0" y1="${Math.round(height * 0.70) + 3}" x2="${width}" y2="${Math.round(height * 0.70) + 3}" stroke="#1E0E05" stroke-width="2" opacity="0.7" />

        <!-- Table plank lines -->
        <line x1="180" y1="${Math.round(height * 0.70)}" x2="120" y2="${height}" stroke="#271206" stroke-width="1.5" opacity="0.4" />
        <line x1="480" y1="${Math.round(height * 0.70)}" x2="430" y2="${height}" stroke="#271206" stroke-width="1.5" opacity="0.4" />
        <line x1="780" y1="${Math.round(height * 0.70)}" x2="740" y2="${height}" stroke="#271206" stroke-width="1.5" opacity="0.4" />

        <!-- Corner Filigrees -->
        <g stroke="#78350F" stroke-width="1.5" fill="none" opacity="0.4">
          <path d="M 38,50 L 50,38 M 38,60 L 60,38 M 38,70 L 70,38" />
          <path d="M ${width - 38},50 L ${width - 50},38 M ${width - 38},60 L ${width - 60},38 M ${width - 38},70 L ${width - 70},38" />
        </g>

        <!-- Vignette -->
        <rect width="${width}" height="${height}" fill="url(#vignette)" />
      </svg>
    `;
  }

  if (styleKey === "modern") {
    // Gaya Modern: Studio 3D pedestal, neon halo glow, curved architectural lines
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="modernBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0F172A" />
            <stop offset="50%" stop-color="#1E293B" />
            <stop offset="100%" stop-color="#090D16" />
          </linearGradient>
          <radialGradient id="neonGlow" cx="72%" cy="65%" r="48%">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.38" />
            <stop offset="50%" stop-color="#0284C7" stop-opacity="0.16" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.0" />
          </radialGradient>
          <linearGradient id="podiumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#334155" />
            <stop offset="40%" stop-color="#1E293B" />
            <stop offset="100%" stop-color="#0F172A" />
          </linearGradient>
          <linearGradient id="rimGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#38BDF8" />
            <stop offset="50%" stop-color="#818CF8" />
            <stop offset="100%" stop-color="#38BDF8" />
          </linearGradient>
        </defs>

        <rect width="${width}" height="${height}" fill="url(#modernBg)" />

        <!-- Modern Architectural Arcs in Background -->
        <circle cx="820" cy="460" r="380" fill="none" stroke="#1E3A8A" stroke-width="1.5" opacity="0.45" />
        <circle cx="820" cy="460" r="480" fill="none" stroke="#0284C7" stroke-width="1" stroke-dasharray="8,6" opacity="0.3" />
        <circle cx="820" cy="460" r="580" fill="none" stroke="#38BDF8" stroke-width="0.75" opacity="0.2" />

        <!-- Neon Ambient Glow -->
        <rect width="${width}" height="${height}" fill="url(#neonGlow)" />

        <!-- Geometric Studio Pedestal (3D Cylinder) -->
        <g transform="translate(0, 0)">
          <!-- Pedestal Base Body -->
          <path d="M 500,${Math.round(height * 0.84)} L 500,${Math.round(height * 0.94)} Q 780,${Math.round(height * 1.02)} 1060,${Math.round(height * 0.94)} L 1060,${Math.round(height * 0.84)} Z" fill="url(#podiumGrad)" />
          
          <!-- Pedestal Top Surface -->
          <ellipse cx="780" cy="${Math.round(height * 0.84)}" rx="280" ry="70" fill="#1E293B" stroke="url(#rimGlow)" stroke-width="3" />
          <ellipse cx="780" cy="${Math.round(height * 0.84)}" rx="260" ry="62" fill="#0F172A" opacity="0.85" />
          
          <!-- Neon Halo Ring beneath Product -->
          <ellipse cx="780" cy="${Math.round(height * 0.84)}" rx="210" ry="46" fill="none" stroke="#38BDF8" stroke-width="2.5" opacity="0.7" />
        </g>
      </svg>
    `;
  }

  if (styleKey === "ceria") {
    // Gaya Ceria: Ledakan radial sunburst enerjik, pop-art dots, sparks, sunset crimson-orange-gold
    const centerX = Math.round(width * 0.75);
    const centerY = Math.round(height * 0.58);
    const rayCount = 18;
    let raysSvg = "";
    for (let i = 0; i < rayCount; i++) {
      const angle1 = (i * 360) / rayCount;
      const angle2 = angle1 + 10;
      const r = Math.max(width, height) * 1.4;
      const rad1 = (angle1 * Math.PI) / 180;
      const rad2 = (angle2 * Math.PI) / 180;
      const x1 = centerX + r * Math.cos(rad1);
      const y1 = centerY + r * Math.sin(rad1);
      const x2 = centerX + r * Math.cos(rad2);
      const y2 = centerY + r * Math.sin(rad2);
      raysSvg += `<polygon points="${centerX},${centerY} ${Math.round(x1)},${Math.round(y1)} ${Math.round(x2)},${Math.round(y2)}" fill="#F59E0B" opacity="0.18" />`;
    }

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="spicyFire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#C2410C" />
            <stop offset="35%" stop-color="#DC2626" />
            <stop offset="75%" stop-color="#991B1B" />
            <stop offset="100%" stop-color="#7F1D1D" />
          </linearGradient>
          <radialGradient id="sunburstYellow" cx="75%" cy="58%" r="60%">
            <stop offset="0%" stop-color="#FDE047" stop-opacity="0.55" />
            <stop offset="45%" stop-color="#EA580C" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.0" />
          </radialGradient>
        </defs>

        <!-- Warm Background Gradient -->
        <rect width="${width}" height="${height}" fill="url(#spicyFire)" />

        <!-- Dynamic Radial Sunburst Rays -->
        <g>${raysSvg}</g>

        <!-- Ambient Center Glow -->
        <rect width="${width}" height="${height}" fill="url(#sunburstYellow)" />

        <!-- Floating Starbursts & Sparks -->
        <g fill="#FDE047" opacity="0.85">
          <path d="M 80,110 L 84,122 L 96,126 L 84,130 L 80,142 L 76,130 L 64,126 L 76,122 Z" />
          <path d="M 440,75 L 443,84 L 452,87 L 443,90 L 440,99 L 437,90 L 428,87 L 437,84 Z" />
          <path d="M 980,240 L 983,249 L 992,252 L 983,255 L 980,264 L 977,255 L 968,252 L 977,249 Z" />
          <circle cx="500" cy="180" r="5" />
          <circle cx="920" cy="120" r="7" />
          <circle cx="150" cy="850" r="6" />
        </g>

        <!-- Ground Stage Oval -->
        <ellipse cx="${centerX}" cy="${Math.round(height * 0.88)}" rx="320" ry="70" fill="#7F1D1D" opacity="0.65" />
        <ellipse cx="${centerX}" cy="${Math.round(height * 0.88)}" rx="250" ry="46" fill="#FDE047" opacity="0.22" />
      </svg>
    `;
  }

  if (styleKey === "minimalis") {
    // Gaya Minimalis: Studio arsitektural bersih, gobo window blinds sunlight shadow, batu travertine
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cleanWall" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F8FAFC" />
            <stop offset="60%" stop-color="#F1F5F9" />
            <stop offset="100%" stop-color="#E2E8F0" />
          </linearGradient>
          <linearGradient id="travertine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#E2E8F0" />
            <stop offset="40%" stop-color="#CBD5E1" />
            <stop offset="100%" stop-color="#94A3B8" />
          </linearGradient>
        </defs>

        <rect width="${width}" height="${height}" fill="url(#cleanWall)" />

        <!-- Gobo Window Blind Sunlight Shadows (Angled Light Beams) -->
        <g fill="#000000" opacity="0.04" transform="rotate(-25 500 500)">
          <rect x="-200" y="100" width="${width * 2}" height="65" />
          <rect x="-200" y="240" width="${width * 2}" height="65" />
          <rect x="-200" y="380" width="${width * 2}" height="65" />
          <rect x="-200" y="520" width="${width * 2}" height="65" />
          <rect x="-200" y="660" width="${width * 2}" height="65" />
          <rect x="-200" y="800" width="${width * 2}" height="65" />
        </g>

        <!-- Minimalist Swiss Design Crosshairs & Grid Lines -->
        <g stroke="#94A3B8" stroke-width="1" opacity="0.35">
          <line x1="50" y1="50" x2="70" y2="50" />
          <line x1="60" y1="40" x2="60" y2="60" />
          <line x1="${width - 70}" y1="50" x2="${width - 50}" y2="50" />
          <line x1="${width - 60}" y1="40" x2="${width - 60}" y2="60" />
          <line x1="60" y1="${height - 60}" x2="60" y2="${height - 40}" />
          <line x1="50" y1="${height - 50}" x2="70" y2="${height - 50}" />
        </g>

        <!-- Limestone Platform Stage -->
        <rect x="0" y="${Math.round(height * 0.74)}" width="${width}" height="${Math.round(height * 0.26)}" fill="url(#travertine)" opacity="0.35" />
        <line x1="0" y1="${Math.round(height * 0.74)}" x2="${width}" y2="${Math.round(height * 0.74)}" stroke="#94A3B8" stroke-width="2" opacity="0.5" />
        
        <!-- Oval Pedestal Shadow -->
        <ellipse cx="${Math.round(width * 0.73)}" cy="${Math.round(height * 0.86)}" rx="260" ry="44" fill="#64748B" opacity="0.25" />
      </svg>
    `;
  }

  if (styleKey === "natural") {
    // Gaya Natural: Nuansa sage & linen organik, anyaman bambu/rotan, bayangan dedaunan tropis
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="naturalWarm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F4EFE6" />
            <stop offset="55%" stop-color="#EAE3D2" />
            <stop offset="100%" stop-color="#DACFBA" />
          </linearGradient>
          <linearGradient id="bambooMat" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#D7BE93" />
            <stop offset="50%" stop-color="#C4A674" />
            <stop offset="100%" stop-color="#9E7E4D" />
          </linearGradient>
        </defs>

        <rect width="${width}" height="${height}" fill="url(#naturalWarm)" />

        <!-- Dappled Sunlight Leaf Silhouettes (Monstera / Tropical Leaves) -->
        <g fill="#47624B" opacity="0.12">
          <ellipse cx="980" cy="180" rx="220" ry="110" transform="rotate(-30 980 180)" />
          <ellipse cx="1060" cy="340" rx="190" ry="90" transform="rotate(-15 1060 340)" />
          <ellipse cx="140" cy="160" rx="160" ry="80" transform="rotate(35 140 160)" />
        </g>

        <!-- Woven Bamboo Mat Tabletop -->
        <polygon points="0,${Math.round(height * 0.71)} ${width},${Math.round(height * 0.71)} ${width},${height} 0,${height}" fill="url(#bambooMat)" />
        <line x1="0" y1="${Math.round(height * 0.71)}" x2="${width}" y2="${Math.round(height * 0.71)}" stroke="#7E5F33" stroke-width="2.5" opacity="0.8" />

        <!-- Bamboo Weave Lines -->
        <g stroke="#7E5F33" stroke-width="1.2" opacity="0.35" stroke-dasharray="8,4">
          <line x1="0" y1="${Math.round(height * 0.75)}" x2="${width}" y2="${Math.round(height * 0.75)}" />
          <line x1="0" y1="${Math.round(height * 0.79)}" x2="${width}" y2="${Math.round(height * 0.79)}" />
          <line x1="0" y1="${Math.round(height * 0.83)}" x2="${width}" y2="${Math.round(height * 0.83)}" />
          <line x1="0" y1="${Math.round(height * 0.87)}" x2="${width}" y2="${Math.round(height * 0.87)}" />
          <line x1="0" y1="${Math.round(height * 0.91)}" x2="${width}" y2="${Math.round(height * 0.91)}" />
        </g>

        <!-- Botanical Flourish in Top Left -->
        <path d="M 60,110 Q 120,80 170,120 Q 140,150 60,110 Z" fill="#65A30D" opacity="0.25" />
      </svg>
    `;
  }

  // Default: Tradisional & Elegan (Mahoni tua, Rumah Gadang gonjong silhouette watermark, Songket Minang emas, warm spotlight)
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wallDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1A0B05" />
          <stop offset="45%" stop-color="#2D150B" />
          <stop offset="100%" stop-color="#120603" />
        </linearGradient>
        <linearGradient id="tableWood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#4E2713" />
          <stop offset="20%" stop-color="#5E311A" />
          <stop offset="60%" stop-color="#3D1D0D" />
          <stop offset="100%" stop-color="#241006" />
        </linearGradient>
        <radialGradient id="spotLight" cx="74%" cy="42%" r="68%">
          <stop offset="0%" stop-color="#FFA726" stop-opacity="0.36" />
          <stop offset="45%" stop-color="#D84315" stop-opacity="0.16" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.0" />
        </radialGradient>
        <linearGradient id="songketCloth" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#991B1B" />
          <stop offset="50%" stop-color="#7F1D1D" />
          <stop offset="100%" stop-color="#450A0A" />
        </linearGradient>
      </defs>

      <!-- Mahogany Wood Wall -->
      <rect width="${width}" height="${height}" fill="url(#wallDark)" />

      <!-- Rumah Gadang Gonjong Silhouette Watermark -->
      <g opacity="0.14" fill="#F59E0B">
        <!-- Center Big Gonjong Roof Curve -->
        <path d="M 450,220 Q 580,100 680,210 Q 780,90 890,210 Q 990,100 1080,230 L 1080,380 L 450,380 Z" />
        <path d="M 520,240 L 520,380 M 640,240 L 640,380 M 760,240 L 760,380 M 880,240 L 880,380" stroke="#F59E0B" stroke-width="2" opacity="0.4" />
      </g>

      <!-- Warm Rustic Wood Presentation Table -->
      <polygon points="0,${Math.round(height * 0.68)} ${width},${Math.round(height * 0.68)} ${width},${height} 0,${height}" fill="url(#tableWood)" />
      <line x1="0" y1="${Math.round(height * 0.68)}" x2="${width}" y2="${Math.round(height * 0.68)}" stroke="#8D4C27" stroke-width="2.5" opacity="0.9" />
      <line x1="0" y1="${Math.round(height * 0.68) + 2}" x2="${width}" y2="${Math.round(height * 0.68) + 2}" stroke="#0F0603" stroke-width="2" opacity="0.9" />

      <!-- Songket Runner Drape on Left Table -->
      <path d="M 0,${Math.round(height * 0.72)} L 380,${Math.round(height * 0.68)} L 320,${height} L 0,${height} Z" fill="url(#songketCloth)" opacity="0.92" />
      
      <!-- Songket Gold Geometric Minang Weave Motifs -->
      <g stroke="#F59E0B" stroke-width="2" opacity="0.75">
        <line x1="0" y1="${Math.round(height * 0.74)}" x2="360" y2="${Math.round(height * 0.70)}" stroke-dasharray="6,4" />
        <line x1="0" y1="${Math.round(height * 0.78)}" x2="350" y2="${Math.round(height * 0.74)}" stroke-dasharray="6,4" />
        <line x1="0" y1="${Math.round(height * 0.82)}" x2="340" y2="${Math.round(height * 0.78)}" stroke-dasharray="6,4" />
        <line x1="0" y1="${Math.round(height * 0.86)}" x2="330" y2="${Math.round(height * 0.82)}" stroke-dasharray="6,4" />
        <line x1="0" y1="${Math.round(height * 0.90)}" x2="320" y2="${Math.round(height * 0.86)}" stroke-dasharray="6,4" />
      </g>

      <!-- Warm Dramatic Ambient Spotlight -->
      <rect width="${width}" height="${height}" fill="url(#spotLight)" />
    </svg>
  `;
}

/**
 * Mesin Kompositor Poster Fotorealistik Cerdas UMKita
 * Menggabungkan FOTO PRODUK ASLI PENGGUNA dengan LATAR FOTOGRAFI KOMERSIAL OTENTIK,
 * TIPOGRAFI ADAPTIF, SERTA BADGE DAN CAPTION YANG DISESUAIKAN PENUH DENGAN TUJUAN & AUDIENS.
 */
export async function composePosterImage(options: PosterCompositionOptions): Promise<Buffer> {
  const format = options.format || "feed_4_5";
  let WIDTH = 1080;
  let HEIGHT = 1350; // Standar Feed Instagram 4:5

  if (format === "story_9_16") {
    WIDTH = 1080;
    HEIGHT = 1920;
  } else if (format === "feed_1_1") {
    WIDTH = 1080;
    HEIGHT = 1080;
  }

  // Normalisasi presetStyle
  let styleKey = (options.presetStyle || "tradisional").toLowerCase();
  if (styleKey === "rustic_minang") styleKey = "tradisional";
  if (styleKey === "vintage" || styleKey === "nostalgia_vintage") styleKey = "klasik";
  if (styleKey === "claymorphism") styleKey = "modern";
  if (styleKey === "clean" || styleKey === "editorial") styleKey = "minimalis";
  if (styleKey === "bold_promo" || styleKey === "bold_punch_promo") styleKey = "ceria";
  const style = POSTER_STYLES[styleKey] || POSTER_STYLES.tradisional;

  const rawProductName = (options.productName || "Kripik Balado Sanjai Nafama").trim();
  const brandName = (options.brandName || "SANJAI NAFAMA").toUpperCase();
  const formattedPrice = formatPrice(options.price);
  const showPrice = options.showPriceBadge ?? true;
  const promoText = options.promoBadgeText || "Hemat 20%";
  const showHalal = options.showHalalStamp ?? true;
  const marketingGoal = options.marketingGoal || "promo_diskon";
  const targetAudience = options.targetAudience || "wisatawan";
  const variationIndex = options.variationIndex || 0;

  // 1. Siapkan Latar Belakang Panggung Fotorealistik Komersial
  let backdropBuffer: Buffer;
  if (options.backdropBuffer && Buffer.isBuffer(options.backdropBuffer) && options.backdropBuffer.length > 1000) {
    backdropBuffer = await sharp(options.backdropBuffer).resize(WIDTH, HEIGHT, { fit: "cover" }).toBuffer();
  } else {
    const backdropSvg = renderStudioStageSvg(WIDTH, HEIGHT, styleKey, marketingGoal, variationIndex);
    backdropBuffer = await sharp(Buffer.from(backdropSvg)).png().toBuffer();
  }

  // 2. Siapkan Foto Produk Asli Pengguna (Heroic Scale)
  let targetProductWidth = style.productWidth;
  let targetProductHeight = style.productHeight;
  if (format === "story_9_16") {
    targetProductWidth = 540;
    targetProductHeight = 820;
  } else if (format === "feed_1_1") {
    targetProductWidth = Math.round(style.productWidth * 0.9);
    targetProductHeight = Math.round(style.productHeight * 0.85);
  }

  let processedProduct: Buffer;

  // Cek apakah buffer memiliki transparansi atau isCutout
  const inputMeta = await sharp(options.productImageBuffer).metadata();
  const hasCutout = options.isCutout || inputMeta.hasAlpha;

  if (hasCutout) {
    processedProduct = await sharp(options.productImageBuffer)
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
    const frameH = Math.round(targetProductWidth * 1.35);
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

  // 3. Elemen Header Brand Badge
  const escapedBrand = escapeXml(brandName);
  const brandDecoration =
    styleKey === "tradisional"
      ? `<g filter="url(#badgeShadow)"><path d="M0,0 L360,0 C330,55 290,95 240,115 C180,135 110,140 0,140 Z" fill="#7F1D1D"/><path d="M0,135 C105,135 175,130 234,110 C283,90 322,52 352,0" stroke="#F4C766" stroke-width="3.5" fill="none"/><text x="55" y="75" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#FEF3C7" letter-spacing="2">${escapedBrand}</text></g>`
      : styleKey === "klasik"
      ? `<g transform="translate(58,45)"><rect width="250" height="56" rx="4" fill="#F4E9D5" stroke="#873B32" stroke-width="3"/><text x="125" y="35" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#4B2E20" text-anchor="middle" letter-spacing="2">${escapedBrand}</text></g>`
      : styleKey === "modern"
      ? `<g transform="translate(58,48)"><rect width="240" height="52" rx="26" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5"/><circle cx="30" cy="26" r="12" fill="#38BDF8"/><text x="135" y="33" font-family="'Plus Jakarta Sans',Arial,sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapedBrand}</text></g>`
      : styleKey === "minimalis"
      ? `<g transform="translate(62,56)"><text x="0" y="0" font-family="'Plus Jakarta Sans',Arial,sans-serif" font-size="16" font-weight="800" fill="#1E293B" letter-spacing="3">${escapedBrand}</text><line x1="0" y1="18" x2="220" y2="18" stroke="#D97706" stroke-width="3"/></g>`
      : styleKey === "ceria"
      ? `<g transform="translate(50,42)"><path d="M55 0 L66 28 L96 19 L78 45 L102 63 L70 62 L64 94 L48 65 L20 82 L33 52 L0 38 L35 31 Z" fill="#FDE047"/><text x="52" y="52" font-family="Arial Black,Arial" font-size="11" fill="#991B1B" text-anchor="middle">${escapedBrand}</text></g>`
      : `<g transform="translate(58,45)"><rect width="240" height="54" rx="27" fill="#F4EFE6" stroke="#65A30D" stroke-width="2"/><path d="M25 28 Q38 6 51 28 Q38 46 25 28" fill="#65A30D"/><text x="142" y="34" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#14532D" text-anchor="middle">${escapedBrand}</text></g>`;

  // 4. Pisahkan Nama Produk menjadi 2 baris proporsional
  const words = rawProductName.split(/\s+/);
  let line1 = "";
  let line2 = "";
  if (words.length <= 2) {
    line1 = words[0] || rawProductName;
    line2 = words[1] || "";
  } else {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(" ");
    line2 = words.slice(mid).join(" ");
  }

  // Adaptive font scaling agar teks panjang tidak pernah kepotong
  const maxLineLength = Math.max(line1.length, line2.length);
  let adaptiveHeadlineSize = style.headlineSize;
  if (maxLineLength > 18) {
    adaptiveHeadlineSize = Math.round(style.headlineSize * 0.72);
  } else if (maxLineLength > 12) {
    adaptiveHeadlineSize = Math.round(style.headlineSize * 0.85);
  }

  const isTraditionalHero = styleKey === "tradisional";
  const headlineLineOneY = adaptiveHeadlineSize;
  const headlineLineTwoY = line2 ? adaptiveHeadlineSize * 2 + 4 : headlineLineOneY;

  // Subtitle dinamis berdasarkan Konteks & Tujuan Promosi & Audiens
  const dynamicSubtitle = options.headline || getDynamicSubtitle(rawProductName, marketingGoal, targetAudience, variationIndex);
  const subtitleY = line2 ? headlineLineTwoY + 54 : headlineLineOneY + 50;

  // Tag Kategori / Promo Goal Header (misal: "🏷️ PENAWARAN SPESIAL", "🎒 OLEH-OLEH KHAS")
  const goalHeaderTag = getGoalHeaderTag(marketingGoal, variationIndex);

  // 3 Smart Badges dinamis sesuai keunggulan produk katalog & tujuan promosi
  const smartBadges = getSmartBadges(options.advantages, marketingGoal, targetAudience, variationIndex);
  const featuresY = subtitleY + 68;
  const priceY = featuresY + (isTraditionalHero ? 165 : 145);

  const featureSize = isTraditionalHero ? 124 : 110;
  const featureGap = isTraditionalHero ? 142 : 126;
  const featureIconSize = isTraditionalHero ? 36 : 32;
  const featureCopySize = isTraditionalHero ? 15 : 14;

  // 5. Susun Lapisan Bayangan Halus Produk (Subject Shadow)
  const subjectShadowSvg = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="productShadow" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="16" /></filter></defs>
      <ellipse cx="${productLeft + prodWidth / 2}" cy="${productTop + prodHeight - 6}" rx="${prodWidth * 0.44}" ry="24" fill="#000000" opacity="0.56" filter="url(#productShadow)" />
      <ellipse cx="${productLeft + prodWidth / 2}" cy="${productTop + prodHeight - 6}" rx="${prodWidth * 0.26}" ry="10" fill="#000000" opacity="0.62" />
    </svg>
  `);

  // 6. Susun Lapisan Tipografi & Elemen Grafis Desain Komersial (SVG Overlay)
  const escapedPromoText = escapeXml(promoText.toUpperCase());
  const escapedGoalHeaderTag = escapeXml(goalHeaderTag);
  const escapedLine1 = escapeXml(line1);
  const escapedLine2 = escapeXml(line2);
  const escapedDynamicSubtitle = escapeXml(dynamicSubtitle);
  const escapedFormattedPrice = escapeXml(formattedPrice);
  const b1Icon = escapeXml(smartBadges[0].icon);
  const b1Line1 = escapeXml(smartBadges[0].line1);
  const b1Line2 = escapeXml(smartBadges[0].line2);
  const b2Icon = escapeXml(smartBadges[1].icon);
  const b2Line1 = escapeXml(smartBadges[1].line1);
  const b2Line2 = escapeXml(smartBadges[1].line2);
  const b3Icon = escapeXml(smartBadges[2].icon);
  const b3Line1 = escapeXml(smartBadges[2].line1);
  const b3Line2 = escapeXml(smartBadges[2].line2);

  const svgOverlayContent = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Drop Shadow Filters -->
        <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.45" />
        </filter>
        <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.65" />
        </filter>
      </defs>

      ${brandDecoration}

      <!-- TOP-RIGHT: Promo Badge (Hemat 20% / Flash Promo) -->
      <g transform="translate(${WIDTH - 220}, 45)" filter="url(#badgeShadow)">
        <rect width="170" height="46" rx="${style.badgeRadius}" fill="${styleKey === "ceria" ? "#FBBF24" : style.accentColor}" />
        <text x="85" y="28" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="14" font-weight="900" fill="${styleKey === "ceria" ? "#991B1B" : "#FFFFFF"}" text-anchor="middle">
          ★ ${escapedPromoText}
        </text>
      </g>

      <!-- HEADLINE & BADGES AREA -->
      <g transform="translate(${style.titleX}, ${style.titleY})" filter="url(#textGlow)">
        <!-- Category / Promotional Goal Pill -->
        <g transform="translate(0, 0)">
          <rect width="260" height="34" rx="17" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" />
          <text x="130" y="22" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="800" fill="${styleKey === "minimalis" || styleKey === "natural" ? style.inkColor : "#FEF08A"}" text-anchor="middle" letter-spacing="1">
            ${escapedGoalHeaderTag}
          </text>
        </g>

        <!-- Line 1 Title -->
        <text x="0" y="${headlineLineOneY + 28}" font-family="${style.headlineFont}" font-size="${adaptiveHeadlineSize}" font-weight="bold" ${styleKey === "tradisional" || styleKey === "klasik" ? 'font-style="italic"' : ""} fill="${style.headlineColor}">
          ${escapedLine1}
        </text>

        <!-- Line 2 Title -->
        ${
          line2
            ? `
        <text x="0" y="${headlineLineTwoY + 28}" font-family="${style.headlineFont}" font-size="${adaptiveHeadlineSize}" font-weight="bold" ${styleKey === "tradisional" || styleKey === "klasik" ? 'font-style="italic"' : ""} fill="${style.accentColor}">
          ${escapedLine2}
        </text>
        `
            : ""
        }

        <!-- Dynamic Context-Aware Subtitle -->
        <text x="0" y="${subtitleY + 28}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${isTraditionalHero ? 34 : 30}" font-weight="700" fill="${styleKey === "minimalis" || styleKey === "natural" ? style.inkColor : "#FDE68A"}" letter-spacing="0.3">
          ${escapedDynamicSubtitle}
        </text>

        <!-- 3 Dynamic Feature Badges from Catalog & Goal -->
        <g transform="translate(0, ${featuresY + 24})">
          <!-- Badge 1 -->
          <g transform="translate(0, 0)" filter="url(#badgeShadow)">
            <rect width="${featureSize}" height="${featureSize}" rx="${style.badgeRadius}" fill="${styleKey === "minimalis" ? "#FFFFFF" : "#FFFDF8"}" stroke="${styleKey === "modern" ? "#38BDF8" : "none"}" stroke-width="1" />
            <text x="${featureSize / 2}" y="${featureSize * 0.42}" font-size="${featureIconSize}" text-anchor="middle">${b1Icon}</text>
            <text x="${featureSize / 2}" y="${featureSize * 0.68}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${featureCopySize}" font-weight="800" fill="#292524" text-anchor="middle">
              ${b1Line1}
            </text>
            <text x="${featureSize / 2}" y="${featureSize * 0.84}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${featureCopySize}" font-weight="800" fill="#292524" text-anchor="middle">
              ${b1Line2}
            </text>
          </g>

          <!-- Badge 2 -->
          <g transform="translate(${featureGap}, 0)" filter="url(#badgeShadow)">
            <rect width="${featureSize}" height="${featureSize}" rx="${style.badgeRadius}" fill="${styleKey === "minimalis" ? "#FFFFFF" : "#FFFDF8"}" stroke="${styleKey === "modern" ? "#38BDF8" : "none"}" stroke-width="1" />
            <text x="${featureSize / 2}" y="${featureSize * 0.42}" font-size="${featureIconSize}" text-anchor="middle">${b2Icon}</text>
            <text x="${featureSize / 2}" y="${featureSize * 0.68}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${featureCopySize}" font-weight="800" fill="#292524" text-anchor="middle">
              ${b2Line1}
            </text>
            <text x="${featureSize / 2}" y="${featureSize * 0.84}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${featureCopySize}" font-weight="800" fill="#292524" text-anchor="middle">
              ${b2Line2}
            </text>
          </g>

          <!-- Badge 3 -->
          <g transform="translate(${featureGap * 2}, 0)" filter="url(#badgeShadow)">
            <rect width="${featureSize}" height="${featureSize}" rx="${style.badgeRadius}" fill="${styleKey === "minimalis" ? "#FFFFFF" : "#FFFDF8"}" stroke="${styleKey === "modern" ? "#38BDF8" : "none"}" stroke-width="1" />
            <text x="${featureSize / 2}" y="${featureSize * 0.42}" font-size="${featureIconSize}" text-anchor="middle">${b3Icon}</text>
            <text x="${featureSize / 2}" y="${featureSize * 0.68}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${featureCopySize}" font-weight="800" fill="#292524" text-anchor="middle">
              ${b3Line1}
            </text>
            <text x="${featureSize / 2}" y="${featureSize * 0.84}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${featureCopySize}" font-weight="800" fill="#292524" text-anchor="middle">
              ${b3Line2}
            </text>
          </g>
        </g>

        <!-- Price Tag & Halal Row -->
        <g transform="translate(0, ${priceY + 24})">
          ${
            showPrice
              ? `
          <g filter="url(#badgeShadow)">
            <rect width="${isTraditionalHero ? 286 : 246}" height="${isTraditionalHero ? 68 : 60}" rx="${style.badgeRadius}" fill="${style.accentColor}" />
            <text x="${isTraditionalHero ? 143 : 123}" y="${isTraditionalHero ? 43 : 38}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${isTraditionalHero ? 23 : 20}" font-weight="900" fill="#1C1917" text-anchor="middle">
              🏷️ ${escapedFormattedPrice} / bks
            </text>
          </g>
          `
              : ""
          }

          ${
            showHalal
              ? `
          <g transform="translate(${showPrice ? (isTraditionalHero ? 304 : 262) : 0}, 0)" filter="url(#badgeShadow)">
            <rect width="${isTraditionalHero ? 154 : 138}" height="${isTraditionalHero ? 68 : 60}" rx="30" fill="#15803D" />
            <text x="${isTraditionalHero ? 77 : 69}" y="${isTraditionalHero ? 42 : 38}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="${isTraditionalHero ? 16 : 14}" font-weight="800" fill="#FFFFFF" text-anchor="middle">
              ✓ HALAL RI
            </text>
          </g>
          `
              : ""
          }
        </g>
      </g>

      <!-- Professional Bottom Call to Action Footer Banner -->
      <g transform="translate(60, ${HEIGHT - 65})">
        <rect width="${WIDTH - 120}" height="42" rx="21" fill="rgba(0,0,0,0.52)" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>
        <text x="${(WIDTH - 120) / 2}" y="26" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">
          📲 Pesan via WhatsApp: +62 812-6789-4521  •  Pengiriman Aman ke Seluruh Indonesia 📦
        </text>
      </g>

    </svg>
  `;

  const svgBuf = Buffer.from(svgOverlayContent);

  // 7. Komposisikan: Latar Panggung + Foto Produk Bersih + Tipografi & Badges
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
