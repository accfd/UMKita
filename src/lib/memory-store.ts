import { SANJAI_NAFAMA_PRODUCTS, SanjaiProduct } from "@/lib/constants";
import {
  getPersistentProducts,
  addPersistentProduct,
  updatePersistentProduct,
  deletePersistentProduct,
  togglePersistentProductActive,
} from "@/lib/products-store";

/**
 * In-memory fallback data store untuk aset pemasaran, riwayat, dan katalog produk
 * Didukung persistensi file lokal di folder data/ agar data tidak pernah hilang
 * saat berpindah menu atau server Next.js me-reload state.
 */

export {
  getPersistentProducts,
  addPersistentProduct,
  updatePersistentProduct,
  deletePersistentProduct,
  togglePersistentProductActive,
};

// Getter memoryProductsStore dinamis selalu mengembalikan state terkini
export const memoryProductsStore: SanjaiProduct[] = new Proxy([] as SanjaiProduct[], {
  get(target, prop, receiver) {
    const list = getPersistentProducts();
    if (prop === "length") return list.length;
    if (typeof prop === "string" && !isNaN(Number(prop))) {
      return list[Number(prop)];
    }
    const val = Reflect.get(list, prop);
    if (typeof val === "function") {
      return val.bind(list);
    }
    return val;
  },
  set(target, prop, value) {
    return true;
  },
});

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

export function deleteFromMemoryStore(id: string): boolean {
  const index = memoryContentsStore.findIndex((item) => item.id === id);
  if (index !== -1) {
    memoryContentsStore.splice(index, 1);
    return true;
  }
  return false;
}

export function updateMemoryStore(
  id: string,
  update: {
    status?: string;
    orderCount?: number;
    inquiryCount?: number;
    notes?: string;
    caption?: string;
  }
): boolean {
  const item = memoryContentsStore.find((it) => it.id === id);
  if (!item) return false;

  if (update.status) {
    item.activity.publicationStatus = update.status;
    if (update.status === "published") {
      item.savedAt = new Date().toISOString();
    }
  }
  if (update.orderCount !== undefined) item.activity.orderCount = update.orderCount;
  if (update.inquiryCount !== undefined) item.activity.inquiryCount = update.inquiryCount;
  if (update.notes !== undefined) item.activity.notes = update.notes;
  if (update.caption !== undefined) item.caption = update.caption;

  return true;
}
