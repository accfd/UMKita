import fs from "fs";
import path from "path";

export interface StoredMarketingPlan {
  goalId: string;
  goalType: string;
  goalNotes?: string | null;
  businessName: string;
  businessLocation: string;
  items: Array<{
    id: string;
    goalId: string;
    dayNumber: number;
    dayName: string;
    scheduledDate: string;
    topic: string;
    contentType: string;
    badge: string;
    description: string;
    recommendedProductId: string;
    productName: string;
    productPrice: number;
    productImageUrl: string;
    status: "planned" | "generated" | "published";
    matchScore?: number;
    isBundle?: boolean;
    secondaryProductId?: string;
    secondaryProductName?: string;
    secondaryProductPrice?: number;
    secondaryProductImageUrl?: string;
  }>;
  isLocked: boolean;
  createdAt: string;
  source: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const MARKETING_FILE = path.join(DATA_DIR, "marketing-store.json");

declare global {
  // eslint-disable-next-line no-var
  var __umkita_marketing_plan__: StoredMarketingPlan | null | undefined;
}

export function getStoredActivePlan(): StoredMarketingPlan | null {
  try {
    if (global.__umkita_marketing_plan__ !== undefined) {
      return global.__umkita_marketing_plan__;
    }
    if (!fs.existsSync(MARKETING_FILE)) {
      global.__umkita_marketing_plan__ = null;
      return null;
    }
    const raw = fs.readFileSync(MARKETING_FILE, "utf-8");
    if (!raw.trim()) {
      global.__umkita_marketing_plan__ = null;
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
      global.__umkita_marketing_plan__ = parsed;
      return parsed;
    }
    global.__umkita_marketing_plan__ = null;
    return null;
  } catch (err) {
    console.warn("Gagal membaca marketing-store.json:", err);
    return null;
  }
}

export function setStoredActivePlan(plan: StoredMarketingPlan): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MARKETING_FILE, JSON.stringify(plan, null, 2), "utf-8");
    global.__umkita_marketing_plan__ = plan;
  } catch (err) {
    console.warn("Gagal menulis marketing-store.json:", err);
  }
}

export function clearStoredActivePlan(): void {
  try {
    if (fs.existsSync(MARKETING_FILE)) {
      fs.unlinkSync(MARKETING_FILE);
    }
    global.__umkita_marketing_plan__ = null;
  } catch (err) {
    console.warn("Gagal menghapus marketing-store.json:", err);
    global.__umkita_marketing_plan__ = null;
  }
}

export function updateStoredPlanItem(id: string, updates: Partial<StoredMarketingPlan["items"][0]>): boolean {
  try {
    const plan = getStoredActivePlan();
    if (!plan || !plan.items) return false;
    const idx = plan.items.findIndex((item) => item.id === id);
    if (idx === -1) return false;
    plan.items[idx] = { ...plan.items[idx], ...updates };
    setStoredActivePlan(plan);
    return true;
  } catch (err) {
    console.warn("Gagal update stored plan item:", err);
    return false;
  }
}

