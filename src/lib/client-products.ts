import { SANJAI_NAFAMA_PRODUCTS, SanjaiProduct } from "@/lib/constants";

const STORAGE_KEY = "umkita:products:v2";
const EVENT_NAME = "umkita-products-updated";

const DEFAULT_CLIENT_PRODUCTS: SanjaiProduct[] = [
  ...SANJAI_NAFAMA_PRODUCTS.map((p) => ({ ...p })),
  {
    id: "prod-karupuak-jangek",
    name: "Karupuak Jangek",
    price: 40000,
    category: "Kerupuk Tradisional",
    description: "Olahan keripik kulit sapi tradisional khas Nagari Padang Ganting, Tanah Datar.",
    advantages: "Bahan alami tanpa pewarna buatan, renyah gurih tahan 2 bulan.",
    originalImageUrl: "/produk/produk2.jpg",
    cutoutImageUrl: "/assets/produk2_cutout_ai.png",
    badge: "Baru Ditambah",
    isActive: true,
  },
];

export function getLocalProducts(): SanjaiProduct[] {
  if (typeof window === "undefined") {
    return DEFAULT_CLIENT_PRODUCTS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[client-products] Failed to read localStorage:", err);
  }

  return DEFAULT_CLIENT_PRODUCTS;
}

export function saveLocalProducts(products: SanjaiProduct[]): void {
  if (typeof window === "undefined" || !Array.isArray(products)) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { products },
      })
    );
  } catch (err) {
    console.warn("[client-products] Failed to save localStorage:", err);
  }
}

export function subscribeToProducts(callback: (products: SanjaiProduct[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent)?.detail;
    if (detail?.products && Array.isArray(detail.products)) {
      callback(detail.products);
    } else {
      callback(getLocalProducts());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) callback(parsed);
      } catch {}
    }
  };

  window.addEventListener(EVENT_NAME, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}

