import fs from "fs";
import path from "path";
import { SANJAI_NAFAMA_PRODUCTS, SanjaiProduct } from "@/lib/constants";

// Global cache to prevent re-reading or state loss during hot reload in dev mode
declare global {
  // eslint-disable-next-line no-var
  var __umkita_products__: SanjaiProduct[] | undefined;
}

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products-store.json");

const DEFAULT_PRODUCTS: SanjaiProduct[] = [
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

function ensureStorage(): SanjaiProduct[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(PRODUCTS_FILE)) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2), "utf-8");
      global.__umkita_products__ = DEFAULT_PRODUCTS;
      return DEFAULT_PRODUCTS;
    }

    const raw = fs.readFileSync(PRODUCTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Pastikan Karupuak Jangek ada jika sebelumnya belum tercatat
      const hasJangek = parsed.some((p: SanjaiProduct) => p.name.toLowerCase().includes("jangek"));
      let data = parsed;
      if (!hasJangek) {
        data = [
          ...parsed,
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
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2), "utf-8");
      }
      global.__umkita_products__ = data;
      return data;
    }
  } catch (err) {
    console.warn("[products-store] Warning reading file storage, using memory fallback:", err);
  }

  if (!global.__umkita_products__) {
    global.__umkita_products__ = DEFAULT_PRODUCTS;
  }
  return global.__umkita_products__;
}

function saveStorage(products: SanjaiProduct[]): void {
  global.__umkita_products__ = products;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
  } catch (err) {
    console.error("[products-store] Failed to write products to disk:", err);
  }
}

export function getPersistentProducts(): SanjaiProduct[] {
  return ensureStorage();
}

export function addPersistentProduct(product: SanjaiProduct): SanjaiProduct {
  const current = getPersistentProducts();
  // Filter out any existing item with same id
  const filtered = current.filter((p) => p.id !== product.id);
  const updated = [product, ...filtered];
  saveStorage(updated);
  return product;
}

export function updatePersistentProduct(
  id: string,
  updates: Partial<SanjaiProduct>
): SanjaiProduct | null {
  const current = getPersistentProducts();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updatedItem: SanjaiProduct = {
    ...current[index],
    ...updates,
  };
  current[index] = updatedItem;
  saveStorage([...current]);
  return updatedItem;
}

export function togglePersistentProductActive(id: string): SanjaiProduct | null {
  const current = getPersistentProducts();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return null;

  current[index].isActive = !current[index].isActive;
  saveStorage([...current]);
  return current[index];
}

export function deletePersistentProduct(id: string): boolean {
  const current = getPersistentProducts();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return false;

  current.splice(index, 1);
  saveStorage([...current]);
  return true;
}

