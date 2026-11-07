/**
 * In-memory fallback data store untuk aset pemasaran dan riwayat
 * Memastikan demo hackathon tetap berjalan mulus tanpa ketergantungan koneksi remote DB
 */

export interface MarketingContentRecord {
  id: string;
  productId: string | null;
  contentPlanId: string | null;
  format: "POSTER" | "VIDEO_REEL";
  templateId: string;
  finalMediaUrl: string;
  caption: string;
  hashtags: string[];
  savedAt: string;
  createdAt: string;
  activity: {
    publicationStatus: string;
    inquiryCount: number;
    orderCount: number;
    targetChannel?: string;
    notes?: string;
  };
}

export const memoryContentsStore: MarketingContentRecord[] = [
  {
    id: "cnt-001928",
    productId: "prod-sanjai-01",
    contentPlanId: null,
    format: "POSTER",
    templateId: "tradisional",
    finalMediaUrl: "/assets/sanjai_poster_ai.jpg",
    caption:
      "Sanjai Safama - Sensasi Renyah Asli Ranah Minang! Diolah dari singkong Bukittinggi pilihan dengan kerenyahan maksimal. Rasa asli, renyah & gurih berbalut bumbu lado otentik tanpa bahan pengawet. 🌶️✨",
    hashtags: ["#SanjaiNafama", "#KulinerMinang", "#OlehOlehPadang"],
    savedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    activity: {
      publicationStatus: "published",
      targetChannel: "instagram_feed",
      inquiryCount: 14,
      orderCount: 8,
      notes: "Respon pelanggan Instagram sangat antusias, banyak DM tanya harga grosir.",
    },
  },
  {
    id: "cnt-001929",
    productId: "prod-rendang-01",
    contentPlanId: null,
    format: "POSTER",
    templateId: "klasik",
    finalMediaUrl: "/assets/rendang.jpg",
    caption:
      "Rendang Kering Suir Daging Asli Payakumbuh! Bumbu meresap hingga ke serat terdalam. Praktis siap santap kapan saja. 🍲",
    hashtags: ["#RendangNafama", "#KulinerMinang", "#RendangPadang"],
    savedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    activity: {
      publicationStatus: "published",
      targetChannel: "instagram_feed",
      inquiryCount: 22,
      orderCount: 15,
      notes: "Poster promosi Feed tembus engagement tinggi di Instagram Feed & WA Story.",
    },
  },
];

