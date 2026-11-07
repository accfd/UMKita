/**
 * UMKita Shared Data Contracts & Types
 * Acuan kontrak bersama untuk:
 * - Modul 1: Rafa (Auth, Onboarding, Produk, Dashboard)
 * - Modul 2 & 3: Fuad (Marketing Assistant, Planner 7 Hari)
 * - Modul 4 & 5: Ferdi (AI Studio, Motion Video, History/Assets)
 */

// 1. Bisnis & Brand Kit (Modul 1)
export interface BusinessProfile {
  id: string;
  name: string;
  category: 'kuliner' | 'kriya' | 'fashion' | 'jasa';
  location: string;
  targetAudience: string;
  brandColors: {
    primary: string;    // HEX (#2563EB)
    secondary: string;  // HEX (#F59E0B)
  };
  visualPreset: string; // e.g. "rustic_minang", "claymorphism"
  communicationTone: 'ramah' | 'persuasif' | 'edukatif';
}

// 2. Katalog Produk (Modul 1 -> Modul 2, 3, 4)
export interface ProductItem {
  id: string;
  businessId?: string;
  name: string;
  price: number;
  category: string;
  description: string;
  advantages: string;
  originalImageUrl?: string;
  cutoutImageUrl?: string; // Transparan setelah background removal WASM
  isActive?: boolean;
}

// 3. Asisten Pemasaran (Modul 2)
export type CampaignGoalType = 'promo' | 'launch' | 'awareness' | 'education';

export interface CampaignRecommendation {
  goalType: CampaignGoalType;
  title: string;
  description: string;
  recommendedProductIds: string[];
  keyMessages: string[];
  suggestedContentType: 'poster' | 'video' | 'carousel';
}

// 4. Perencana Konten 7 Hari (Modul 3)
export type ContentStatus = 'draft' | 'ready' | 'published';

export interface ContentPlanItem {
  id: string;
  dayIndex: number;         // 1 - 7 (Senin - Minggu)
  dayName: string;          // "Senin", "Selasa", dll.
  date: string;             // YYYY-MM-DD
  topic: string;
  goalType: CampaignGoalType;
  targetProductId: string;
  targetProductName?: string;
  status: ContentStatus;
  captionPreview?: string;
}

// 5. AI Copywriting Contract (Modul 4)
export interface CopywritingRequest {
  productName: string;
  category: string;
  advantages: string;
  goalType: CampaignGoalType;
  style: 'storytelling' | 'hard-sell';
}

export interface CopywritingResponse {
  hook: string;
  caption: string;
  callToAction: string;
  hashtags: string[];
}

// 6. Galeri Aset & Media Rendered (Modul 4 & 5)
export type MediaFormat = 'POSTER' | 'VIDEO_REEL';

export interface GeneratedAsset {
  id: string;
  productId: string;
  productName: string;
  format: MediaFormat;
  aspectRatio: '1:1' | '9:16';
  previewUrl: string;
  downloadUrl: string;
  caption: string;
  hashtags: string[];
  presetName: string;
  createdAt: string;
}

