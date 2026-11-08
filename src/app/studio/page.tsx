"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { getLocalProducts, subscribeToProducts } from "@/lib/client-products";
import {
  Wand2,
  Sparkles,
  Camera,
  Search,
  Bell,
  Home,
  Package,
  FolderArchive,
  Image as ImageIcon,
  FileText,
  Zap,
  Check,
  Download,
  Copy,
  RefreshCw,
  X,
  Pencil,
  FileWarning,
  AlertTriangle,
  Share2,
  Trash2,
  Minimize2,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { extractColorsFromImageElement, ColorPalette } from "@/lib/color-harmony";
import { removeProductBackground } from "@/lib/background-removal";

// 6 Preset Gaya Branding (Persis Sesuai Screenshot Modal Figma Image 2)
const PRESET_OPTIONS = [
  {
    id: "tradisional",
    name: "Tradisional",
    tag: "Tradisional & Elegan",
    gradient: "linear-gradient(135deg, #241007 0%, #451E0E 100%)",
    textColor: "#FEF3C7",
    subtext: "Ornamen Nusantara, warna rempah & kayu",
    bgClass: "from-[#241007] to-[#451E0E]",
  },
  {
    id: "klasik",
    name: "Klasik",
    tag: "Nostalgia Tempo Dulu",
    gradient: "linear-gradient(135deg, #F6EBD4 0%, #D9C29A 100%)",
    textColor: "#451A03",
    subtext: "Kertas sepia hangat & stempel retro",
    bgClass: "from-[#F6EBD4] to-[#D9C29A]",
  },
  {
    id: "modern",
    name: "Modern",
    tag: "Fresh & Kekinian",
    gradient: "linear-gradient(135deg, #BAE6FD 0%, #FDE047 100%)",
    textColor: "#0369A1",
    subtext: "Warna cerah, bentuk rounded & playful",
    bgClass: "from-[#BAE6FD] to-[#FDE047]",
  },
  {
    id: "minimalis",
    name: "Minimalis",
    tag: "Clean & Simple",
    gradient: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)",
    textColor: "#0F172A",
    subtext: "Latar studio bersih & komposisi rapi",
    bgClass: "from-[#FFFFFF] to-[#E2E8F0]",
  },
  {
    id: "ceria",
    name: "Ceria",
    tag: "Fun & Enerjik",
    gradient: "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)",
    textColor: "#FEF08A",
    subtext: "Warna kontras, api menyala & bold",
    bgClass: "from-[#EA580C] to-[#DC2626]",
  },
  {
    id: "natural",
    name: "Natural",
    tag: "Organik & Alami",
    gradient: "linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%)",
    textColor: "#14532D",
    subtext: "Nuansa hijau daun & tekstur alami",
    bgClass: "from-[#F0FDF4] to-[#BBF7D0]",
  },
];

type StudioProduct = {
  id: string;
  name: string;
  price: number;
  originalImageUrl: string;
  cutoutImageUrl?: string;
  advantages?: string;
  description?: string;
  isActive?: boolean;
};

// Helper: Menentukan asset foto & cutout yang tepat untuk setiap produk katalog
const getProductAssets = (product?: StudioProduct | null) => {
  if (!product) {
    return {
      image: "/assets/produk3_cutout_ai.png",
      cutout: "/assets/produk3_cutout_ai.png",
      isCutout: true,
    };
  }

  const cutoutMap: Record<string, string> = {
    "prod-sanjai-tawar": "/assets/produk1_cutout_ai.png",
    "prod-karak-kaliang": "/assets/produk2_cutout_ai.png",
    "prod-sanjai-balado": "/assets/produk3_cutout_ai.png",
    "prod-sanjai-stik": "/assets/produk4_cutout_ai.png",
    "prod-dakak-dakak": "/assets/produk5_cutout_ai.png",
  };

  const isJangek = product.name?.toLowerCase().includes("jangek");
  const fallbackCutout = isJangek ? "/uploads/produk_1794084255882_qj4od2_cutout.png" : undefined;

  const cutout = product.cutoutImageUrl || cutoutMap[product.id] || fallbackCutout || null;
  const image = cutout || product.originalImageUrl || "/produk/produk3.jpg";

  return {
    image,
    cutout,
    isCutout: Boolean(cutout),
  };
};

type GeneratedCaption = {
  hook: string;
  caption: string;
  callToAction: string;
  hashtags: string[];
  isFallback: boolean;
};

const presetForMarketingGoal = (goal: string | null) => {
  if (goal === "promo_diskon") return "ceria";
  if (goal === "product_launch") return "modern";
  if (goal === "brand_awareness") return "tradisional";
  if (goal === "edukasi_pelanggan") return "minimalis";
  return "tradisional";
};

function StudioContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const planId = searchParams.get("planId");
  const topic = searchParams.get("topic");
  const goal = searchParams.get("goal");
  const isAuto = searchParams.get("auto") === "true";
  const autoRunRef = useRef(false);

  // Mode Tampilan:
  // "empty"        -> Foto Figma 1 (Tarik foto produkmu ke sini)
  // "processing"   -> Foto Figma 2 (Tahap 2 dari 3: Segmentasi Visual 62%)
  // "error"        -> Foto Figma 3 (AI Segmentation Timeout 504 / Fallback)
  // "result_feed"  -> Foto Figma 5 (Hasil Feed 4:5 Cutout Bersih AI)
  // "result_framed"-> Foto Figma 4 (Hasil Feed 4:5 Mode Foto Asli / Fallback)
  const initialMode = (searchParams.get("mode") as any) || "empty";
  const [viewMode, setViewState] = useState<
    "empty" | "processing" | "error" | "result_feed" | "result_framed"
  >(
    initialMode === "result_framed"
      ? "result_framed"
      : initialMode === "result_feed" || initialMode === "result_story"
      ? "result_feed"
      : initialMode === "error"
      ? "error"
      : initialMode === "processing"
      ? "processing"
      : "empty"
  );

  // Tab Hasil: "poster" | "caption"
  const [activeTab, setActiveTab] = useState<"poster" | "caption">("poster");

  // Konfigurasi Produk & Branding
  const [productName, setProductName] = useState("Keripik Sanjai Balado Merah");
  const [productPrice, setProductPrice] = useState("25000");
  const [selectedProductId, setSelectedProductId] = useState("prod-sanjai-balado");
  const [availableProducts, setAvailableProducts] = useState<StudioProduct[]>(() => getLocalProducts() as any);
  const [selectedPreset, setSelectedPreset] = useState("tradisional");
  const [contentFormat, setContentFormat] = useState<"feed">("feed");
  const [headlineText, setHeadlineText] = useState("Sanjai Safama - Camilan Renyah Khas Minang");

  // Top Navbar Search State
  const [studioSearchQuery, setStudioSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const studioSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (studioSearchRef.current && !studioSearchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Model Generasi AI: ComfyUI Local Engine (Offline / Bebas Kuota)
  const [selectedAiModel] = useState<"comfyui" | "gemini-2.5-flash-image" | "gpt-image-2.6-sunburst">("comfyui");
  const [userApiKey, setUserApiKey] = useState("");
  const [activeModelSource, setActiveModelSource] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const isGeminiQuotaError = Boolean(
    generationError && (/quota/i.test(generationError) || /rate limit/i.test(generationError))
  );

  const visualEngineLabel =
    activeModelSource === "comfyui-local" || selectedAiModel === "comfyui"
      ? "ComfyUI Local Studio (RTX 3050)"
      : activeModelSource === "gemini-2.5-flash-image"
      ? "Gemini AI Studio (Otentik Minang)"
      : activeModelSource === "gpt-image-2.6-sunburst"
      ? "GPT-Image 2.6 Sunburst"
      : "ComfyUI Local Studio (RTX 3050)";

  // Kuesioner Preferensi Desain AI (Pilihan Ganda Referensi)
  const [marketingGoal, setMarketingGoal] = useState("promo_diskon");
  const [targetAudience, setTargetAudience] = useState("wisatawan");
  const [variationCounter, setVariationCounter] = useState(0);

  // Fitur Revisi Desain AI dengan Prompting (Magic Prompt)
  const [magicPrompt, setMagicPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // Toggles Pengaturan Tambahan (Persis Screenshot)
  const [colorHarmony, setColorHarmony] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showPromoBadge, setShowPromoBadge] = useState(true);
  const [badgePromoText, setBadgePromoText] = useState("Hemat 20%");
  const [halalStamp, setHalalStamp] = useState(true);
  const [frameFotoAsli, setFrameFotoAsli] = useState(false);

  // Palet Warna Hasil Ekstraksi AI Color Harmony
  const [extractedPalette, setExtractedPalette] = useState<ColorPalette>({
    dominant: "#DC2626",
    accent: "#FEA619",
    background: "#EFF6FF",
    textColor: "#1E2A5E",
  });

  // State File & Gambar Produk Asli + Cutout
  const [currentImageSrc, setCurrentImageSrc] = useState<string>("/assets/produk3_cutout_ai.png");
  const [cutoutImageSrc, setCutoutImageSrc] = useState<string | null>("/assets/produk3_cutout_ai.png");
  const [fileDetails, setFileDetails] = useState({
    name: "sanjai_balado_kemasan_ori.jpg",
    size: "6.4 MB",
    dimension: "3024 x 4032 px",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper Simpan Sesi Studio ke localStorage agar foto & poster tidak hilang saat refresh/pindah menu
  const STUDIO_SESSION_KEY = "umkita:active-studio-session";

  const saveStudioSession = (data: Record<string, any>) => {
    if (typeof window === "undefined") return;
    try {
      const existing = JSON.parse(window.localStorage.getItem(STUDIO_SESSION_KEY) || "{}");
      const merged = { ...existing, ...data, timestamp: Date.now() };
      window.localStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn("Gagal menyimpan sesi studio:", e);
    }
  };

  // Restore Sesi Studio yang tersimpan jika pengguna membuka halaman langsung
  useEffect(() => {
    if (typeof window === "undefined" || isAuto || productId) return;
    try {
      const savedRaw = window.localStorage.getItem(STUDIO_SESSION_KEY);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved.poster || saved.imageSrc) {
          if (saved.poster) setGeneratedPoster(saved.poster);
          if (saved.imageSrc) setCurrentImageSrc(saved.imageSrc);
          if (saved.cutoutSrc) setCutoutImageSrc(saved.cutoutSrc);
          if (saved.productName) setProductName(saved.productName);
          if (saved.productPrice) setProductPrice(saved.productPrice);
          if (saved.headlineText) setHeadlineText(saved.headlineText);
          if (saved.selectedProductId) setSelectedProductId(saved.selectedProductId);
          if (saved.selectedPreset) setSelectedPreset(saved.selectedPreset);
          if (saved.marketingGoal) setMarketingGoal(saved.marketingGoal);
          if (saved.targetAudience) setTargetAudience(saved.targetAudience);
          if (saved.fileDetails) setFileDetails(saved.fileDetails);
          if (saved.caption) setGeneratedCaption(saved.caption);
          setViewState(saved.viewMode || "result_feed");
        }
      }
    } catch (err) {
      console.warn("Notice restoring studio session:", err);
    }
  }, [isAuto, productId]);

  // Produk berasal dari modul Produk yang sama. Studio tidak lagi memakai
  // daftar terpisah, sehingga aset yang disimpan tetap terhubung ke katalog.
  useEffect(() => {
    const syncProducts = () => {
      fetch("/api/products", { cache: "no-store" })
        .then((response) => response.json())
        .then((payload) => {
          if (payload.success && Array.isArray(payload.data)) {
            const prods = payload.data.filter((item: StudioProduct) => item.isActive !== false);
            setAvailableProducts(prods);

            if (!isAuto && !productId) {
              const savedRaw = typeof window !== "undefined" ? window.localStorage.getItem(STUDIO_SESSION_KEY) : null;
              if (!savedRaw) {
                const initial = prods.find((p: StudioProduct) => p.id === "prod-sanjai-balado") || prods[0];
                if (initial && (!selectedProductId || selectedProductId === "prod-sanjai-balado")) {
                  setSelectedProductId(initial.id);
                  setProductName(initial.name);
                  setProductPrice(String(initial.price));
                  setHeadlineText(initial.description || `${initial.name} - Camilan khas pilihan`);
                  const assets = getProductAssets(initial);
                  setCurrentImageSrc(assets.image);
                  setCutoutImageSrc(assets.cutout);
                }
              }
            }

          }
        })
        .catch(() => {});
    };

    syncProducts();
    const unsub = subscribeToProducts((prods) => {
      const activeProds = prods.filter((item: any) => item.isActive !== false);
      setAvailableProducts(activeProds as any);
    });
    return () => unsub();
  }, [isAuto, productId, selectedProductId]);

  // State Hasil AI (Poster Sharp Compositor / ComfyUI, Copywriting Gemini)
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState<GeneratedCaption>({
    hook: "Sensasi Renyah Asli Ranah Minang yang Bikin Ketagihan! 🌶️✨",
    caption:
      "Sanjai Safama diolah langsung dari singkong Bukittinggi pilihan dengan kerenyahan maksimal. Rasa asli, renyah & gurih berbalut bumbu lado otentik tanpa bahan pengawet! Cocok untuk teman santai bersama keluarga.",
    callToAction: "Pesan sekarang via link bio untuk promo terbatas hemat 20%! 📲",
    hashtags: ["#SanjaiSafama", "#KulinerMinang", "#OlehOlehPadang", "#Bukittinggi", "#UMKita"],
    isFallback: false,
  });

  // State Modal Slider Perbandingan Sebelum/Sesudah
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareSlider, setCompareSlider] = useState(50);

  // Toast Notifikasi Sukses Salin
  const [copyToast, setCopyToast] = useState(false);

  // Processing Progress Animation
  const [progress, setProgress] = useState(62);
  const [timeRemaining, setTimeRemaining] = useState(4);

  // Efek Timer Progress saat di state "processing"
  useEffect(() => {
    if (viewMode !== "processing") return;
    setProgress(15);
    setTimeRemaining(5);

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 98) {
          clearInterval(timer);
          return 98;
        }
        return p + 12;
      });
      setTimeRemaining((t) => (t > 1 ? t - 1 : 1));
    }, 450);

    return () => clearInterval(timer);
  }, [viewMode]);

  // Fungsi memuat gambar ke dalam HTMLImageElement
  const loadHtmlImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  // Pipeline Terintegrasi: Jalankan Pemrosesan AI End-to-End
  const runFullAiGenerationPipeline = async (
    imageSrc: string,
    targetMode: "result_feed" | "result_framed" = "result_feed",
    overrideProductName?: string,
    overrideHeadline?: string,
    overridePreset?: string,
    isCutoutOverride?: boolean,
    overrideGoal?: string,
    onComplete?: (result: { poster: string; caption: GeneratedCaption }) => Promise<void> | void,
    overridePrice?: string,
    overrideAudience?: string,
    overrideVariationIndex?: number
  ) => {
    try {
      setViewState("processing");
      setIsComposing(true);
      setGenerationError(null);

      const activeProductName = overrideProductName || productName;
      const activeHeadline = overrideHeadline || headlineText;
      const activePreset = overridePreset || selectedPreset;
      const activeProductPrice = overridePrice || productPrice;
      const effectiveGoal = overrideGoal || marketingGoal;
      const effectiveAudience = overrideAudience || targetAudience;
      const effectiveVariation =
        typeof overrideVariationIndex === "number" ? overrideVariationIndex : variationCounter;

      const activeProd = availableProducts.find(
        (p) => p.name.toLowerCase() === activeProductName.toLowerCase() || p.id === selectedProductId
      );
      const activeAdvantages = activeProd?.advantages || "100% Olahan Asli Minangkabau, Renyah Maksimal, Tanpa Pengawet";
      const activeCategory = (activeProd as any)?.category || "Kuliner Minang";

      // 1. Ekstrak AI Color Harmony langsung dari citra produk
      try {
        const imgEl = await loadHtmlImage(imageSrc);
        const palette = extractColorsFromImageElement(imgEl);
        setExtractedPalette(palette);
      } catch (err) {
        console.warn("AI Color Harmony fallback ke palet default:", err);
      }

      // 2. Keep the untouched photo for the generative model. The cutout is only
      // used by the deterministic compositor fallback.
      let originalBase64 = imageSrc;
      if (!originalBase64.startsWith("data:")) {
        const originalResponse = await fetch(imageSrc);
        const originalBlob = await originalResponse.blob();
        originalBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(originalBlob);
        });
      }

      const base64Data = originalBase64;
      // Jangan pernah memperlakukan foto mentah sebagai PNG transparan. Jika
      // segmentasi gagal, kompositor memakai mode frame yang jujur dan rapi.
      const isCutout = isCutoutOverride ?? Boolean(
        imageSrc === cutoutImageSrc ||
          imageSrc.includes("cutout") ||
          imageSrc.endsWith(".png") ||
          originalBase64.startsWith("data:image/png")
      );

      const apiFormat = "feed_4_5";

      // 3. Panggil API Sharp Compositor & AI Generator (/api/studio/compose-poster)
      const composePromise = fetch("/api/studio/compose-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productImageBase64: base64Data,
          referenceImageBase64: originalBase64,
          productName: activeProductName,
          price: activeProductPrice,
          headline: activeHeadline,
          brandName: "SANJAI NAFAMA",
          presetStyle: activePreset,
          marketingGoal: effectiveGoal,
          targetAudience: effectiveAudience,
          advantages: activeAdvantages,
          category: activeCategory,
          variationIndex: effectiveVariation,
          primaryColor: extractedPalette.dominant,
          secondaryColor: extractedPalette.background,
          showPriceBadge: showPrice,
          promoBadgeText: badgePromoText,
          format: apiFormat,
          showHalalStamp: halalStamp,
          isCutout,
          forceGenerativeAi: true,
          aiModel: selectedAiModel,
          apiKey: userApiKey || undefined,
        }),
      })
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok || !payload.success) throw new Error(payload.error || "Gagal membuat poster AI.");
          return payload;
        })
        .then((res) => {
          if (res.success && res.finalImageBase64) {
            setGeneratedPoster(res.finalImageBase64);
            if (res.model || res.source) {
              setActiveModelSource(res.model || res.source);
            }
            return res.finalImageBase64 as string;
          }
          throw new Error("Poster AI tidak menghasilkan gambar.");
        })
        .catch((error) => {
          console.error("Compose API error:", error);
          throw error;
        });

      // 4. Panggil API Gemini 1.5 Flash Copywriting (/api/ai/copywrite)
      const copywritingPromise = fetch("/api/ai/copywrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: activeProductName,
          advantages: activeAdvantages,
          goalType: effectiveGoal,
          targetAudience: effectiveAudience,
          toneOfVoice: activePreset,
          price: activeProductPrice,
          category: activeCategory,
          variationIndex: effectiveVariation,
          style: effectiveAudience === "anak_muda" ? "ramah_santai" : "soft-sell",
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) return res.data as GeneratedCaption;
          return null;
        })
        .catch((e) => {
          console.error("Gemini API error:", e);
          return null;
        });

      const [poster, copy] = await Promise.all([
        composePromise,
        copywritingPromise,
      ]);

      const finalCaption = copy || generatedCaption;
      if (copy) setGeneratedCaption(copy);
      await onComplete?.({ poster, caption: finalCaption });

      // Simpan sesi aktif ke localStorage agar tidak hilang saat pengguna berpindah menu
      saveStudioSession({
        poster,
        caption: finalCaption,
        imageSrc: imageSrc,
        cutoutSrc: cutoutImageSrc,
        productName: activeProductName,
        productPrice: activeProductPrice,
        headlineText: activeHeadline,
        selectedProductId: selectedProductId,
        selectedPreset: activePreset,
        marketingGoal: effectiveGoal,
        targetAudience: effectiveAudience,
        viewMode: targetMode,
      });

      setViewState(targetMode);
    } catch (err) {
      console.error("Pipeline failure:", err);
      setGenerationError(err instanceof Error ? err.message : "Gagal membuat poster AI.");
      setViewState("error");
    } finally {
      setIsComposing(false);
    }
  };

  // Masuk dari kartu rekomendasi: produk, tema, cutout, poster, copy, dan
  // penyimpanan konten dijalankan satu alur tanpa pengguna memilih ulang.
  useEffect(() => {
    if (!isAuto || !productId || autoRunRef.current || availableProducts.length === 0) return;
    const product = availableProducts.find((item) => item.id === productId);
    autoRunRef.current = true;

    if (!product) {
      setGenerationError("Produk dari rekomendasi tidak ditemukan atau sudah tidak aktif.");
      setViewState("error");
      return;
    }

    const preset = presetForMarketingGoal(goal);
    const headline = topic || product.description || product.name;
    const assets = getProductAssets(product);

    setSelectedProductId(product.id);
    setProductName(product.name);
    setProductPrice(String(product.price || 25000));
    setHeadlineText(headline);
    setSelectedPreset(preset);
    if (goal) setMarketingGoal(goal);
    setCurrentImageSrc(assets.image);
    setCutoutImageSrc(assets.cutout);
    setViewState("processing");

    void (async () => {
      let source = assets.cutout || assets.image;
      let cutout = assets.isCutout;

      if (!cutout && product.originalImageUrl) {
        try {
          const response = await fetch(product.originalImageUrl);
          const blob = await response.blob();
          const file = new File([blob], `${product.id}.png`, { type: blob.type || "image/png" });
          const removed = await removeProductBackground(file);
          if (removed?.base64) {
            source = removed.base64;
            cutout = removed.isCutout;
            if (cutout) setCutoutImageSrc(source);
            setCurrentImageSrc(source);
          }
        } catch (error) {
          console.warn("Cutout otomatis gagal; lanjut dengan komposisi foto asli:", error);
        }
      }

      await runFullAiGenerationPipeline(
        source,
        "result_feed",
        product.name,
        headline,
        preset,
        cutout,
        goal || undefined,
        async ({ poster, caption }) => {
          const fullCaption = `${caption.hook}\n\n${caption.caption}\n\n${caption.callToAction}`;
          await fetch("/api/marketing/contents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: product.id,
              contentPlanId: planId || undefined,
              format: "POSTER",
              templateId: preset,
              finalMediaUrl: poster,
              caption: fullCaption,
              hashtags: caption.hashtags,
            }),
          });
          if (planId) {
            await fetch("/api/marketing/planner", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: planId, status: "generated" }),
            });
          }
        },
        String(product.price || 25000)
      );
    })();
  // The ref guarantees one execution for this navigation, even after state updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableProducts, isAuto, productId]);

  // Handler Revisi Desain dengan AI Prompting (Magic Prompting)
  const handleApplyMagicPrompt = async () => {
    if (!magicPrompt.trim()) return;
    try {
      setIsRefining(true);
      const res = await fetch("/api/studio/refine-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: magicPrompt,
          currentData: {
            productName,
            price: productPrice,
            currentHeadline: headlineText,
            currentCaption: generatedCaption.caption,
            currentPreset: selectedPreset,
            currentPrimaryColor: extractedPalette.dominant,
            currentSecondaryColor: extractedPalette.background,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.revisedHeadline) setHeadlineText(data.revisedHeadline);
        if (data.revisedCaption) {
          setGeneratedCaption((prev) => ({
            ...prev,
            caption: data.revisedCaption,
          }));
        }
        if (data.revisedPreset) setSelectedPreset(data.revisedPreset);
        if (data.revisedPrimaryColor) {
          setExtractedPalette((prev) => ({
            ...prev,
            dominant: data.revisedPrimaryColor,
            background: data.revisedSecondaryColor || prev.background,
          }));
        }

        // Jalankan re-render komposisi poster dengan parameter baru
        await runFullAiGenerationPipeline(
          cutoutImageSrc || currentImageSrc,
          "result_feed"
        );
        setMagicPrompt("");
        alert(data.aiExplanation || "Desain berhasil direvisi sesuai instruksi promptmu!");
      }
    } catch (err) {
      console.error("Gagal revisi AI:", err);
    } finally {
      setIsRefining(false);
    }
  };

  // Handler Memproses File yang Dipilih / Didrop
  const processSelectedFile = (file: File) => {
    // Reset seluruh gambar sesi sebelumnya sebelum layar processing tampil.
    // Object URL tersedia seketika, sehingga scanner selalu memperlihatkan
    // foto yang baru dipilih—bukan cutout dari upload sebelumnya.
    const localPreviewUrl = URL.createObjectURL(file);
    setCurrentImageSrc(localPreviewUrl);
    setGeneratedPoster(null);
    setViewState("processing");
    setIsComposing(true);
    setGenerationError(null);
    setCutoutImageSrc(null); // Reset cutout lama agar scanner tidak menampilkan produk lama!

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileDetails({
      name: file.name,
      size: `${sizeInMb} MB`,
      dimension: "3024 x 4032 px",
    });

    // Bersihkan nama file sebagai fallback nama produk jika form belum diisi
    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();
    const fallbackName = cleanFileName.length > 2 && !/^\d+$/.test(cleanFileName)
      ? cleanFileName.charAt(0).toUpperCase() + cleanFileName.slice(1)
      : (availableProducts[0]?.name || "Produk Unggulan Minang");

    const detectedProductName = productName.trim() || fallbackName;
    const detectedHeadline = headlineText.trim() || `${detectedProductName} — Cita Rasa Gurih & Renyah Autentik`;
    const detectedPrice = productPrice.trim() || "25000";

    if (!productName.trim()) setProductName(detectedProductName);
    if (!headlineText.trim()) setHeadlineText(detectedHeadline);
    if (!productPrice.trim()) setProductPrice(detectedPrice);

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setCurrentImageSrc(result);
      URL.revokeObjectURL(localPreviewUrl);

      // Tunggu model segmentasi sampai selesai.
      let processedImage: string | null = null;
      let processedIsCutout = false;
      try {
        const processed = await removeProductBackground(file, (p) => setProgress(p));
        if (processed?.base64) {
          processedImage = processed.base64;
          processedIsCutout = processed.isCutout;
          if (processed.isCutout) setCutoutImageSrc(processed.base64);
        }
      } catch (e) {
        console.warn("AI background removal fallback ke gambar asli:", e);
      }

      // Simpan versi yang benar-benar dipakai poster.
      if (processedImage) setCurrentImageSrc(processedImage);

      runFullAiGenerationPipeline(
        processedImage || result,
        "result_feed",
        detectedProductName,
        detectedHeadline,
        selectedPreset,
        processedIsCutout,
        marketingGoal,
        undefined,
        detectedPrice,
        targetAudience,
        variationCounter
      );
    };
    reader.readAsDataURL(file);

    // Reset input value agar dapat memilih file yang sama berulang kali
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handler Upload Foto dari Perangkat
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Handler Pilih Chip Cepat Produk Sampel
  const handleSelectSample = (sample: "sanjai" | "rendang" | "karak") => {
    if (sample === "sanjai") {
      const prod = availableProducts.find((p) => p.id === "prod-sanjai-balado") || availableProducts[0];
      const assets = getProductAssets(prod);
      const name = prod?.name || "Keripik Sanjai Balado Merah";
      const price = String(prod?.price || 25000);
      const headline = prod?.description || "Sanjai Safama - Camilan Renyah Khas Minang";
      setSelectedProductId(prod?.id || "prod-sanjai-balado");
      setProductName(name);
      setProductPrice(price);
      setHeadlineText(headline);
      setCurrentImageSrc(assets.image);
      setCutoutImageSrc(assets.cutout);
      runFullAiGenerationPipeline(
        assets.cutout || assets.image,
        "result_feed",
        name,
        headline,
        selectedPreset,
        assets.isCutout,
        marketingGoal,
        undefined,
        price
      );
    } else if (sample === "karak") {
      const prod = availableProducts.find((p) => p.id === "prod-karak-kaliang") || availableProducts[1] || availableProducts[0];
      const assets = getProductAssets(prod);
      const name = prod?.name || "Karak Kaliang / Angka Delapan";
      const price = String(prod?.price || 18000);
      const headline = prod?.description || "Sensasi Renyah Gurih Khas Minang";
      setSelectedProductId(prod?.id || "prod-karak-kaliang");
      setProductName(name);
      setProductPrice(price);
      setHeadlineText(headline);
      setCurrentImageSrc(assets.image);
      setCutoutImageSrc(assets.cutout);
      runFullAiGenerationPipeline(
        assets.cutout || assets.image,
        "result_feed",
        name,
        headline,
        selectedPreset,
        assets.isCutout,
        marketingGoal,
        undefined,
        price
      );
    } else {
      setSelectedProductId("");
      setProductName("Rendang Kering Suir Nafama");
      setProductPrice("65000");
      setHeadlineText("Rendang Suir Asli Payakumbuh");
      setCurrentImageSrc("/assets/rendang.jpg");
      setCutoutImageSrc(null);
      runFullAiGenerationPipeline(
        "/assets/rendang.jpg",
        "result_feed",
        "Rendang Kering Suir Nafama",
        "Rendang Suir Asli Payakumbuh",
        selectedPreset,
        false,
        marketingGoal,
        undefined,
        "65000"
      );
    }
  };

  const handleCatalogProductChange = (productId: string) => {
    const product = availableProducts.find((item) => item.id === productId);
    setSelectedProductId(productId);
    if (!product) return;

    const newName = product.name;
    const newPrice = String(product.price);
    const newHeadline = product.description || `${product.name} - Camilan khas pilihan`;
    const assets = getProductAssets(product);

    setProductName(newName);
    setProductPrice(newPrice);
    setHeadlineText(newHeadline);
    setCurrentImageSrc(assets.image);
    setCutoutImageSrc(assets.cutout);

    runFullAiGenerationPipeline(
      assets.cutout || assets.image,
      "result_feed",
      newName,
      newHeadline,
      selectedPreset,
      assets.isCutout,
      marketingGoal,
      undefined,
      newPrice,
      targetAudience,
      variationCounter
    );
  };

  const handleMarketingGoalChange = (newGoal: string) => {
    setMarketingGoal(newGoal);
    if (viewMode.startsWith("result")) {
      runFullAiGenerationPipeline(
        cutoutImageSrc || currentImageSrc,
        "result_feed",
        productName,
        headlineText,
        selectedPreset,
        Boolean(cutoutImageSrc),
        newGoal,
        undefined,
        productPrice,
        targetAudience,
        variationCounter
      );
    }
  };

  const handleTargetAudienceChange = (newAudience: string) => {
    setTargetAudience(newAudience);
    if (viewMode.startsWith("result")) {
      runFullAiGenerationPipeline(
        cutoutImageSrc || currentImageSrc,
        "result_feed",
        productName,
        headlineText,
        selectedPreset,
        Boolean(cutoutImageSrc),
        marketingGoal,
        undefined,
        productPrice,
        newAudience,
        variationCounter
      );
    }
  };

  const handleRegenerateVariation = () => {
    const nextVar = variationCounter + 1;
    setVariationCounter(nextVar);
    runFullAiGenerationPipeline(
      cutoutImageSrc || currentImageSrc,
      "result_feed",
      productName,
      headlineText,
      selectedPreset,
      Boolean(cutoutImageSrc),
      marketingGoal,
      undefined,
      productPrice,
      targetAudience,
      nextVar
    );
  };

  // 1-Click Simpan Aset ke Database Modul 4.2 & Modul 5 (/history)
  const handleSaveAsset = async () => {
    const assetPayload = {
      id: `local-${Date.now()}`,
      productId: selectedProductId,
      productName,
      productPrice: Number(productPrice) || 0,
      format: "POSTER",
      templateId: selectedPreset,
      finalMediaUrl: generatedPoster || currentImageSrc,
      caption: `${generatedCaption.hook}\n\n${generatedCaption.caption}\n\n${generatedCaption.callToAction}`,
      hashtags: generatedCaption.hashtags,
      savedAt: new Date().toISOString(),
    };
    const saveBrowserCopy = () => {
      try {
        const existing = JSON.parse(window.localStorage.getItem("umkita:gallery-fallback") || "[]");
        window.localStorage.setItem("umkita:gallery-fallback", JSON.stringify([assetPayload, ...existing].slice(0, 30)));
      } catch (storageError) {
        console.warn("Cadangan Galeri Aset di browser tidak tersedia:", storageError);
      }
    };
    try {
      // Galeri langsung mendapat salinan browser, termasuk ketika hot reload
      // membuat endpoint development kehilangan memory-store sementara.
      saveBrowserCopy();
      const response = await fetch("/api/marketing/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetPayload),
      });
      if (!response.ok) throw new Error("Endpoint penyimpanan aset tidak merespons.");
      alert("✅ Aset promosi berhasil disimpan ke Galeri Aset & Riwayat!");
    } catch (e) {
      // Fallback saat server lokal menolak payload poster besar.
      saveBrowserCopy();
      alert("✅ Aset tersimpan di Galeri Aset pada perangkat ini.");
    }
  };

  // 1-Click Salin Teks Caption ke Clipboard
  const handleCopyCaption = () => {
    const fullText = `${generatedCaption.hook}\n\n${generatedCaption.caption}\n\n${generatedCaption.callToAction}\n\n${generatedCaption.hashtags.join(" ")}`;
    navigator.clipboard.writeText(fullText);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  // 1-Click Share ke WhatsApp / Web Share API
  const handleWebShare = async () => {
    const fullText = `🔥 PROMO SPESIAL: ${productName.toUpperCase()}! 🔥\nHarga Hemat: Rp ${parseInt(productPrice).toLocaleString("id-ID")} / bks\n\n${generatedCaption.caption}\n\n${generatedCaption.callToAction}\n\n${generatedCaption.hashtags.join(" ")}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: fullText,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share dibatalkan");
      }
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, "_blank");
    }
  };

  // Unduh Poster PNG
  const handleDownloadPoster = () => {
    if (!generatedPoster) return;
    const a = document.createElement("a");
    a.href = generatedPoster;
    a.download = `${productName.toLowerCase().replace(/\s+/g, "_")}_poster.png`;
    a.click();
  };

  return (
    <AppLayout productCount={availableProducts.length || undefined}>
    <div className="studio-page min-h-screen bg-[#F8F9FE] text-[#1E2A5E] font-sans antialiased flex flex-col">
      <div className="flex-1 flex">
        {/* ==============================================================
            LEFT SIDEBAR ASIDE (Sesuai Seluruh Screenshot Figma)
           ============================================================== */}
        <aside aria-hidden="true" className="hidden">
          <div className="flex flex-col gap-6">
            {/* Logo UMKita */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden p-1">
                <img src="/assets/logo.jpeg" alt="UMKita Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[18px] tracking-tight text-[#1E2A5E]">UMKita</span>
                  <span className="bg-[#E8EDFB] text-[#2563EB] text-[9px] font-extrabold px-1.5 py-0.5 rounded leading-none">
                    PWA
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">Asisten Branding UMKM</p>
              </div>
            </div>

            {/* Navigasi Menu */}
            <nav className="flex flex-col gap-1.5">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold text-[#434655] hover:bg-[#F2F4FD] transition-colors"
              >
                <Home className="w-4 h-4 text-[#434655]" />
                <span>Beranda</span>
              </Link>

              <Link
                href="/products"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold text-[#434655] hover:bg-[#F2F4FD] transition-colors"
              >
                <Package className="w-4 h-4 text-[#434655]" />
                <span>Produk</span>
              </Link>

              {/* AI Studio (Aktif) */}
              <Link
                href="/studio"
                className="flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] shadow-[0_8px_16px_-4px_rgba(37,99,235,0.35)] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>AI Studio</span>
                </div>
                <span className="bg-[#EA580C] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                  Baru
                </span>
              </Link>

              {/* Galeri Aset (Modul 5) */}
              <Link
                href="/history"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold text-[#434655] hover:bg-[#F2F4FD] transition-colors"
              >
                <FolderArchive className="w-4 h-4 text-[#434655]" />
                <span>Galeri Aset</span>
              </Link>
            </nav>
          </div>

          {/* Profile Card Sanjai Nafama */}
          <div className="bg-white border border-white/90 rounded-[24px] p-3.5 flex flex-col gap-2.5 shadow-[0px_14px_28px_-4px_rgba(148,163,184,0.25),inset_2px_2px_5px_rgba(255,255,255,0.95),inset_-2px_-2px_5px_rgba(148,163,184,0.12)]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FEA619] to-[#D97706] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                UR
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-xs text-[#1E2A5E] leading-tight truncate">Sanjai Nafama</h4>
                <p className="text-[10px] text-slate-500">Kuliner • Minang</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E293B]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FEA619]" />
                <span className="text-[10px] font-medium text-slate-500 ml-0.5">Brand Kit</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Aktif</span>
            </div>
          </div>
        </aside>

        {/* ==============================================================
            MAIN CONTENT WRAPPER
           ============================================================== */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          {/* Top Navbar */}
          <header className="studio-topbar h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
            <div className="relative w-[340px]" ref={studioSearchRef}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={studioSearchQuery}
                onChange={(e) => {
                  setStudioSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Cari produk atau konten..."
                className="w-full h-9 pl-9 pr-8 text-xs bg-[#F2F3FF] rounded-full text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {studioSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setStudioSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Dropdown Hasil Pencarian Studio */}
              {isSearchOpen && studioSearchQuery.trim() && (
                <div className="absolute top-11 left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Hasil Pencarian ({availableProducts.filter((p) => p.name.toLowerCase().includes(studioSearchQuery.toLowerCase()) || (p.description && p.description.toLowerCase().includes(studioSearchQuery.toLowerCase()))).length})
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {availableProducts.filter((p) =>
                      p.name.toLowerCase().includes(studioSearchQuery.toLowerCase()) ||
                      (p.description && p.description.toLowerCase().includes(studioSearchQuery.toLowerCase()))
                    ).length > 0 ? (
                      availableProducts
                        .filter((p) =>
                          p.name.toLowerCase().includes(studioSearchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(studioSearchQuery.toLowerCase()))
                        )
                        .map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              handleCatalogProductChange(p.id);
                              setStudioSearchQuery("");
                              setIsSearchOpen(false);
                            }}
                            className="p-2.5 flex items-center gap-3 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <img
                              src={p.originalImageUrl || "/produk/produk1.jpeg"}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                              <p className="text-[11px] font-extrabold text-[#004AC6]">
                                Rp {Number(p.price).toLocaleString("id-ID")}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#004AC6] shrink-0">
                              Pilih
                            </span>
                          </div>
                        ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Tidak ditemukan produk untuk &ldquo;{studioSearchQuery}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button className="relative w-9 h-9 rounded-full bg-[#F2F3FF] flex items-center justify-center text-slate-600 hover:bg-slate-200/70 transition-colors">
                <Bell className="w-4 h-4 text-slate-700" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#DC2626]" />
              </button>

              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs">
                  👤
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1E2A5E] leading-tight">Asisten Branding UMKM</p>
                  <p className="text-[10px] text-slate-400">Pemilik Usaha</p>
                </div>
              </div>
            </div>
          </header>

          {/* Top Banner Notifikasi Hasil */}
          {viewMode === "result_framed" && (
            <div className="mx-8 mt-4 bg-emerald-50 border border-emerald-200 rounded-full py-2 px-4 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">
                  Poster berhasil dibuat dengan Foto Asli! Siap diunduh atau dijadwalkan langsung ke media sosial.
                </span>
              </div>
              <span className="text-[10px] font-bold bg-white text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full">
                Status: Selesai Render
              </span>
            </div>
          )}

          {viewMode === "result_feed" && (
            <div className="mx-8 mt-4 bg-emerald-50 border border-emerald-200 rounded-full py-2 px-4 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">
                  Poster promosi berhasil di-generate AI! Siap diunduh atau dijadwalkan ke media sosial.
                </span>
              </div>
              <span className="text-[10px] font-bold bg-white text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full">
                Tersimpan
              </span>
            </div>
          )}

          {/* Content Body */}
          <div className="studio-content p-8 flex gap-7 items-start">
            {/* ==============================================================
                MAIN WORK AREA (DINAMIS MENYESUAIKAN SCREEN MODE)
               ============================================================== */}
            <div className="studio-workspace flex-1 min-w-0 flex flex-col gap-4">
              {/* Header Title & Subheader */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAEFFF] text-[#2563EB] rounded-full text-[11px] font-bold">
                    <span>
                      {viewMode === "empty"
                        ? "AI CONTENT STUDIO · PEMBUAT POSTER PROMOSI OTOMATIS"
                        : viewMode === "error"
                        ? "AI CONTENT STUDIO · PEMBUAT POSTER PROMOSI OTOMATIS"
                        : "AI CONTENT STUDIO · HASIL GENERASI POSTER OTOMATIS"}
                    </span>
                  </div>

                  {viewMode === "error" ? (
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>Sesi: {productName} (Gagal Memproses Latar Belakang)</span>
                    </div>
                  ) : viewMode !== "empty" ? (
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                      <span>• Sesi: {productName}</span>
                    </div>
                  ) : null}

                  {viewMode === "error" && (
                    <span className="text-[10px] text-slate-400 font-medium ml-1">
                      💳 Kredit AI Studio: 14/20 Kuota
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-[28px] font-extrabold text-[#1E2A5E] tracking-tight">
                        AI Studio Konten
                      </h1>
                      {viewMode === "error" && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                          PERLU PERHATIAN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                      {viewMode === "empty" || viewMode === "error"
                        ? "Unggah foto produk asli untuk otomatis menghapus latar, menghasilkan poster promosi memukau berbalut nuansa Minang, dan caption siap posting."
                        : `Foto produkmu berhasil diolah dengan gaya ${PRESET_OPTIONS.find((p) => p.id === selectedPreset)?.name || "Tradisional"}. Sesuaikan elemen visual atau langsung unduh dengan resolusi tinggi.`}
                    </p>
                  </div>

                  {/* Top Action Tabs (Poster Promosi, Teks Caption) */}
                  <div className="flex items-center gap-2">
                    {viewMode.startsWith("result") && (
                      <div className="flex items-center gap-2">
                        {/* 2 Tab Switcher Terintegrasi */}
                        <div className="inline-flex items-center p-1 bg-[#F2F4FD] rounded-full gap-1">
                          <button
                            onClick={() => setActiveTab("poster")}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                              activeTab === "poster"
                                ? "bg-[#2563EB] text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Poster Promosi (Feed)</span>
                          </button>
                          <button
                            onClick={() => setActiveTab("caption")}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                              activeTab === "caption"
                                ? "bg-[#2563EB] text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Teks Caption</span>
                            <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full">
                              1 Draft
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={handleRegenerateVariation}
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#2563EB] px-3.5 py-1.5 rounded-full shadow-sm hover:bg-[#1D4ED8]"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Regenerasi Variasi</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notice Banner Khusus Mode Foto Asli (Foto 4) */}
              {viewMode === "result_framed" && (
                <div className="bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>⚡ Mode Foto Asli: background tidak dihapus</span>
                  </div>
                  <button
                    onClick={() => runFullAiGenerationPipeline(currentImageSrc, "result_feed")}
                    className="text-amber-700 font-bold hover:underline"
                  >
                    Coba hapus background lagi →
                  </button>
                </div>
              )}

              {/* ==============================================================
                  SCREEN 1: EMPTY STATE DROPZONE (FOTO FIGMA 1)
                 ============================================================== */}
              {viewMode === "empty" && (
                <div className="flex flex-col gap-5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        processSelectedFile(file);
                      }
                    }}
                    className={`cursor-pointer border-2 border-dashed rounded-[28px] p-10 flex flex-col items-center justify-center text-center transition-all shadow-sm ${
                      isDragging
                        ? "border-[#2563EB] bg-blue-50/80 scale-[1.01]"
                        : "border-blue-200 hover:border-blue-400 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    {/* Blue Round Camera Button */}
                    <div className="w-16 h-16 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 relative mb-4">
                      <Camera className="w-8 h-8 text-white" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FEA619] text-white text-[10px] font-bold flex items-center justify-center">
                        ✦
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-[#1E2A5E]">
                      Tarik foto produkmu ke sini atau klik untuk memilih
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Format JPG, PNG, WEBP • maks. 5 MB</p>

                    <div className="flex items-center gap-3 mt-5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-2 rounded-full border border-blue-200 text-[#2563EB] bg-blue-50/50 hover:bg-blue-100/60 font-bold text-xs flex items-center gap-2"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ambil dari Kamera</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSample("sanjai");
                        }}
                        className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs flex items-center gap-2"
                      >
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pilih dari Katalog</span>
                      </button>
                    </div>

                  </div>

                  {/* Mascot Speech Bubble (Foto 1) */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
                    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                      <img src="/assets/mascot.jpg" alt="Maskot" className="w-full h-full object-contain rounded-xl" />
                    </div>
                    <div className="flex-1">
                      <p className="font-extrabold text-xs text-[#1E2A5E]">
                        Mulai dari foto produk aslimu, biar AI yang bikin glowing! 💼
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cukup satu foto mentahan, kami otomatis buatkan poster komersial estetik berbalut nuansa Minang &amp; naskah promosi siap posting.
                      </p>
                    </div>
                  </div>

                  {/* 3 Feature Cards di Bawah */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                        <Zap className="w-5 h-5 text-[#2563EB]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#1E2A5E]">Auto Background</h4>
                        <p className="text-[10px] text-slate-400">Pisahkan objek seketika</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Pencil className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#1E2A5E]">Branded Typography</h4>
                        <p className="text-[10px] text-slate-400">Font &amp; logo terintegrasi</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <Wand2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#1E2A5E]">Caption Generator</h4>
                        <p className="text-[10px] text-slate-400">Copywriting lokal Minang/ID</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  SCREEN 2: PROCESSING STATE 62% WITH LASER SCAN (FOTO FIGMA 2)
                 ============================================================== */}
              {viewMode === "processing" && (
                <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                      <span className="font-extrabold text-sm text-[#1E2A5E]">
                        Tahap 2 dari 3: Segmentasi Visual &amp; Ekstraksi Objek
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#FEF3C7] text-[#D97706] rounded-full text-xs font-bold shadow-xs">
                      <Zap className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Proses AI Aktif</span>
                    </div>
                  </div>

                  {/* Canvas Scanner Frame dengan Garis Laser Cyan */}
                  <div className="bg-[#EFF5FE] rounded-[22px] p-6 flex flex-col items-center justify-center relative overflow-hidden border border-[#DCE7FC]">
                    <div className="relative w-[340px] h-[280px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex items-center justify-center">
                      <div className="scanner-grid absolute inset-0 pointer-events-none" />
                      <div className="absolute top-2 left-2 z-20 bg-[#334155]/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-md">
                        AI_CAM_01
                      </div>
                      <div className="absolute top-2.5 left-24 z-20 text-[9px] font-medium text-slate-400">
                        UMKita - AI Studio Processing State {progress}%
                      </div>

                      <div className="relative w-48 h-48 flex items-center justify-center">
                        <img
                          src={currentImageSrc || cutoutImageSrc || undefined}
                          alt="Product Scan"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-2 border-2 border-cyan-400 rounded-lg pointer-events-none">
                          <span className="absolute -left-1 -top-1 h-4 w-4 border-l-[3px] border-t-[3px] border-cyan-300" />
                          <span className="absolute -right-1 -top-1 h-4 w-4 border-r-[3px] border-t-[3px] border-cyan-300" />
                          <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-[3px] border-l-[3px] border-cyan-300" />
                          <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-[3px] border-r-[3px] border-cyan-300" />
                          <div className="scanner-laser absolute left-0 right-0 h-0.5 bg-cyan-300 shadow-[0_0_16px_#22d3ee]" />
                        </div>
                        <div className="absolute -bottom-2 right-1 bg-[#2563EB] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                          Objek Terdeteksi
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center mt-5">
                      <h3 className="font-extrabold text-base text-[#1E2A5E] flex items-center gap-1.5">
                        <span className="text-[#EA580C]">⚡</span> Menghapus background di perangkatmu...
                      </h3>

                      <div className="w-[440px] max-w-full mt-4 flex flex-col gap-1.5">
                        <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-0.5">
                          <span className="flex items-center gap-1 text-[#2563EB]">
                            ⚙️ {progress}% Selesai
                          </span>
                          <span>~{timeRemaining} detik lagi</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Maskot Speech */}
                  <div className="bg-[#F8F9FE] rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                      <img src="/assets/mascot.jpg" alt="Maskot" className="w-full h-full object-contain rounded-xl" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EA580C] text-white font-bold text-[9px] flex items-center justify-center">
                        !
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 flex-1">
                      <strong className="text-[#2563EB]">Bentar ya, Uni!</strong> Sedang dirapikan tepian {productName}nya biar renyah maksimal. AI lagi menyesuaikan kontras bumbu lado khas Bukittinggi!
                    </p>
                  </div>

                  {/* 3 Step Indicator */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                          ✓
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1E2A5E]">Memuat Model</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">Selesai ✓</p>
                        </div>
                      </div>
                      <span className="w-8 h-0.5 bg-emerald-200" />
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center">
                          <Pencil className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1E2A5E]">Memisahkan Objek</p>
                          <p className="text-[10px] text-[#2563EB] font-bold">Sedang Berjalan...</p>
                        </div>
                      </div>
                      <span className="w-8 h-0.5 bg-slate-200" />
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center">
                          ▦
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400">Menyusun Poster</p>
                          <p className="text-[10px] text-slate-400">Menunggu</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setViewState("error")}
                      className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Batalkan &amp; Ganti Foto</span>
                    </button>
                  </div>

                  {/* Fallback Action Banner */}
                  <div className="p-3.5 bg-[#EFF5FE] border border-[#DCE7FC] rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="text-[#2563EB]">ⓘ</span>
                      <span>Tersedia jika perangkat terasa berat atau ingin proses instan tanpa cropping.</span>
                    </div>
                    <button
                      onClick={() => {
                        setFrameFotoAsli(true);
                        runFullAiGenerationPipeline(currentImageSrc, "result_framed");
                      }}
                      className="px-4 py-2 bg-white border border-slate-200 hover:border-amber-400 text-slate-700 text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pakai Foto Asli (Tanpa Hapus Background)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  SCREEN 3: ERROR / TIMEOUT 504 STATE (FOTO FIGMA 3)
                 ============================================================== */}
              {viewMode === "error" && (
                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center text-center relative">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full mb-3">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>
                        {isGeminiQuotaError
                          ? "Kuota Gemini Image habis"
                          : generationError?.includes("OPENAI_API_KEY_REQUIRED")
                          ? "GPT-Image belum aktif"
                          : "Proses AI belum selesai"}
                      </span>
                    </div>

                    {/* Maskot Sedih */}
                    <div className="relative w-20 h-20 mb-2">
                      <img
                        src="/assets/mascot.jpg"
                        alt="Maskot Sedih"
                        className="w-full h-full object-contain filter grayscale-30"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs">
                        ⚠️
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-500 italic max-w-sm">
                      {isGeminiQuotaError
                        ? "Gemini menerima request, tetapi akun ini belum memiliki kuota image generation yang tersedia."
                        : generationError?.includes("OPENAI_API_KEY_REQUIRED")
                        ? "Aktifkan API key agar poster dibuat oleh GPT-Image, bukan template statis."
                        : "Aduh, proses AI belum berhasil menyusun poster dari foto produkmu."}
                    </p>

                    <h2 className="text-2xl font-black text-[#1E2A5E] mt-3">
                      {isGeminiQuotaError
                        ? "Kuota Gemini Image belum tersedia"
                        : generationError?.includes("OPENAI_API_KEY_REQUIRED")
                        ? "Hubungkan GPT-Image terlebih dahulu"
                        : "Poster AI belum berhasil dibuat"}
                    </h2>
                    <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
                      {generationError || "Coba lagi atau gunakan foto produk lain yang lebih jernih."}
                    </p>

                    {/* Tombol Aksi Error */}
                    <div className="flex items-center gap-3 mt-6">
                      <button
                        onClick={() => {
                          if (generationError?.includes("OPENAI_API_KEY_REQUIRED")) {
                            setShowApiKeyInput(true);
                            return;
                          }
                          runFullAiGenerationPipeline(currentImageSrc, "result_feed");
                        }}
                        className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{generationError?.includes("OPENAI_API_KEY_REQUIRED") ? "Atur API Key" : "Coba Lagi"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setFrameFotoAsli(true);
                          runFullAiGenerationPipeline(currentImageSrc, "result_framed");
                        }}
                        className="px-5 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-full text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Lanjut Tanpa Hapus Background</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setViewState("empty")}
                      className="text-xs font-bold text-[#2563EB] mt-3 flex items-center gap-1.5 hover:underline"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Pilih Foto Lain dari Galeri Perangkat</span>
                    </button>
                  </div>

                  {/* 2 Warning Diagnosis Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <FileWarning className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-red-900">Ukuran file melebihi batas (6.4 MB)</h4>
                        <p className="text-[11px] text-red-700/80 mt-0.5 leading-relaxed">
                          Batas unggah WebAI adalah 5 MB. Gunakan foto yang lebih kecil agar pemrosesan lancar di handphone atau browser.
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-amber-900">Pencahayaan &amp; Kontras Redup</h4>
                        <p className="text-[11px] text-amber-800/80 mt-0.5 leading-relaxed">
                          Warna keripik merah menyatu dengan taplak meja motif. Foto dengan pencahayaan terang dan alas polos untuk hasil terbaik.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tips UMKM Cerdas Banner */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      <span>💡</span>
                      <p>
                        <strong>Tips UMKM Cerdas:</strong> Pastikan koneksi internet stabil saat mengunduh modul kecerdasan buatan, atau ubah resolusi kamera HP ke mode 1080p sebelum memotret produk.
                      </p>
                    </div>
                    <button className="text-xs font-bold text-[#2563EB] hover:underline shrink-0">
                      Panduan Foto Produk →
                    </button>
                  </div>

                  {/* File Info Card */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                        UK
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-[#1E2A5E]">{fileDetails.name}</h5>
                        <p className="text-[11px] text-slate-400">
                          {fileDetails.size} • Dimensi: {fileDetails.dimension} • <span className="text-red-600 font-semibold">Gagal di tahap Remove Background</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F4FD] text-slate-700 rounded-full text-xs font-bold hover:bg-slate-200">
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Kompres Otomatis</span>
                      </button>
                      <button
                        onClick={() => setViewState("empty")}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  SCREEN 4, 5: RESULT VIEWS (POSTER PROMOSI ATAU CAPTION)
                 ============================================================== */}
              {viewMode.startsWith("result") && (
                <div className="flex flex-col gap-5">
                  {/* TAB 1: POSTER PROMOSI (FEED 4:5 / MODE FOTO ASLI) */}
                  {activeTab === "poster" && (
                    <div className="flex flex-col gap-4">
                      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col items-center">
                        {/* Top Bar Info Ukuran & Mac Dots */}
                        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-4 text-xs font-bold text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-400" />
                            <span className="w-3 h-3 rounded-full bg-amber-400" />
                            <span className="w-3 h-3 rounded-full bg-emerald-400" />
                            <span className="ml-2 font-mono text-slate-600">
                              PORTRAIT · 1080 × 1350 PX (4:5)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">🔍 100%</span>
                            <button
                              onClick={() =>
                                runFullAiGenerationPipeline(
                                  cutoutImageSrc || currentImageSrc,
                                  "result_feed",
                                  productName,
                                  headlineText,
                                  selectedPreset,
                                  Boolean(cutoutImageSrc),
                                  marketingGoal,
                                  undefined,
                                  productPrice
                                )
                              }
                              className="p-1 hover:bg-slate-100 rounded"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* LIVE CANVAS POSTER CONTAINER */}
                        <div className="relative flex justify-center items-center my-2">
                          {generatedPoster ? (
                            <div className="relative overflow-hidden rounded-[28px] shadow-2xl border-4 border-white w-[360px] h-[450px] sm:w-[400px] sm:h-[500px]">
                              <img
                                src={generatedPoster}
                                alt="Generated Commercial AI Poster"
                                className="w-full h-full object-cover"
                              />

                            </div>
                          ) : (
                            /* LIVE CLAYMORPHISM POSTER PREVIEW */
                            <div
                              className={`relative rounded-[32px] p-6 flex flex-col justify-between shadow-2xl overflow-hidden border border-white ${
                                viewMode === "result_framed"
                                  ? "w-[380px] h-[475px] bg-[#F2F4FD]"
                                  : "w-[380px] h-[475px] bg-gradient-to-b from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]"
                              }`}
                            >
                              {/* Header Row */}
                              <div className="flex items-center justify-between z-10">
                                <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-full shadow-xs">
                                  <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-white">
                                    ✦
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black tracking-tight text-[#1E2A5E] leading-none">
                                      SANJAI NAFAMA
                                    </p>
                                    <p className="text-[8px] font-bold text-slate-400 leading-none">Khas Minang Asli</p>
                                  </div>
                                </div>

                                {showPromoBadge && (
                                  <div className="bg-[#DC2626] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                                    ★ {badgePromoText.toUpperCase()}
                                  </div>
                                )}
                              </div>

                              {/* Center Visual (Cutout Bersih AI vs Foto Asli) */}
                              <div className="relative flex flex-col items-center justify-center my-auto z-10">
                                {halalStamp && (
                                  <div className="absolute top-0 left-6 bg-white/95 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                    <span>HALAL RI</span>
                                  </div>
                                )}

                                {viewMode === "result_framed" ? (
                                  <div className="w-64 h-44 rounded-2xl overflow-hidden shadow-lg border-2 border-white/80 relative">
                                    <img
                                      src={currentImageSrc}
                                      alt="Product Framed"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                                      Foto Asli Terverifikasi
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-56 h-56 relative drop-shadow-2xl">
                                    <img
                                      src={cutoutImageSrc || currentImageSrc}
                                      alt="Product Cutout"
                                      className="w-full h-full object-contain filter drop-shadow-xl"
                                    />
                                  </div>
                                )}

                                {showPrice && (
                                  <div className="absolute -bottom-3 bg-amber-400 text-[#1E2A5E] font-black text-xs px-3.5 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1">
                                    <span>🏷️ Rp {parseInt(productPrice).toLocaleString("id-ID")}</span>
                                    <span className="text-[9px] font-bold text-slate-600">/bks</span>
                                  </div>
                                )}
                              </div>

                              {/* Headline Typography & WhatsApp Button */}
                              <div className="flex flex-col items-center text-center z-10 pt-4">
                                <span className="text-[9px] font-extrabold tracking-wider text-blue-700 bg-white/80 px-2 py-0.5 rounded-full mb-1">
                                  KRIUK PEDAS MANIS JUARA
                                </span>
                                <h3 className="text-base font-black text-[#1E2A5E] leading-tight">
                                  {headlineText}
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  100% Cabai Asli Bukittinggi • Tanpa Pengawet
                                </p>

                                <div className="mt-3 w-full bg-emerald-600 text-white rounded-full py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                                  <span>💬 Ketuk untuk Pesan via WhatsApp</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bar Informasi & Slider Perbandingan Sebelum/Sesudah */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                              ✂️
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-xs text-[#1E2A5E]">Potong Latar AI</h4>
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                                  Akurasi 99.4%
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400">Model: RemBg Pro • Tepi Halus</p>
                            </div>
                          </div>

                          <button
                            onClick={() => setShowCompareModal(true)}
                            className="px-3 py-1.5 bg-[#EFF5FE] hover:bg-blue-100 text-[#2563EB] text-[11px] font-bold rounded-full"
                          >
                            Buka Slider Perbandingan 1:1
                          </button>
                        </div>

                        {/* Langkah Selanjutnya & Tombol Aksi */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleDownloadPoster}
                              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh PNG Resolusi Tinggi</span>
                            </button>

                            <button
                              onClick={handleWebShare}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Bagikan Cepat</span>
                            </button>

                            <button
                              onClick={handleSaveAsset}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold flex items-center gap-1.5"
                            >
                              <FolderArchive className="w-3.5 h-3.5" />
                              <span>Simpan Aset</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ==============================================================
                          AI MAGIC PROMPT REFINE BOX (FITUR REVISI DENGAN PROMPT BEBAS)
                         ============================================================== */}
                      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/60 border border-blue-200/80 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#2563EB]" />
                            <h4 className="font-extrabold text-xs text-[#1E2A5E]">
                              Mau Merevisi Desain / Teks dengan AI? (Magic Prompting)
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded-full border border-blue-200">
                            Gemini 1.5 Copilot
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          Ketik instruksi revisi yang kamu inginkan tanpa batasan template, misalnya: <em>"Bikin warnanya lebih merah pedas membara dan tambahkan info gratis ongkir se-Sumbar"</em> atau <em>"Ganti headline jadi lebih ramah khas Uni Bukittinggi"</em>.
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={magicPrompt}
                            onChange={(e) => setMagicPrompt(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleApplyMagicPrompt();
                            }}
                            placeholder="Ketik instruksi revisi desain atau copywriting di sini..."
                            className="flex-1 h-9 px-4 bg-white border border-blue-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <button
                            onClick={handleApplyMagicPrompt}
                            disabled={isRefining || !magicPrompt.trim()}
                            className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>{isRefining ? "Merevisi..." : "Terapkan Revisi AI ✨"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TEKS CAPTION (GEMINI 1.5 FLASH DENGAN DIALEK MINANG) */}
                  {activeTab === "caption" && (
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col gap-5">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#2563EB]" />
                          <h3 className="font-extrabold text-sm text-[#1E2A5E]">
                            Naskah Copywriting Promosi Ditenagai AI
                          </h3>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          generatedCaption.isFallback
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${generatedCaption.isFallback ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
                          <span>{generatedCaption.isFallback ? "Offline Smart Template" : "Google Gemini Flash API"}</span>
                        </div>
                      </div>

                      {/* Card Hook & Caption */}
                      <div className="bg-[#F8F9FE] rounded-2xl p-5 border border-slate-200/80 flex flex-col gap-4">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Hook Pembuka (Perhatian Pertama)
                          </span>
                          <p className="text-base font-extrabold text-[#1E2A5E] mt-1">
                            "{generatedCaption.hook}"
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Isi Pesan Promosi (Storytelling Minang)
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed mt-1 whitespace-pre-line">
                            {generatedCaption.caption}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Call to Action (Ajakan Pesan)
                          </span>
                          <p className="text-xs font-bold text-emerald-700 mt-1">
                            👉 {generatedCaption.callToAction}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Rekomendasi Hashtags
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {generatedCaption.hashtags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-white border border-slate-200 text-[#2563EB] text-[11px] font-bold px-2 py-0.5 rounded-full shadow-2xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi Caption */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyCaption}
                            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Seluruh Naskah Caption</span>
                          </button>

                          <button
                            disabled={isGeneratingCaption}
                            onClick={async () => {
                              setIsGeneratingCaption(true);
                              const nextVar = variationCounter + 1;
                              setVariationCounter(nextVar);
                              const activeProd = availableProducts.find(
                                (p) => p.name.toLowerCase() === productName.toLowerCase() || p.id === selectedProductId
                              );
                              try {
                                const r = await fetch("/api/ai/copywrite", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    productName,
                                    advantages: activeProd?.advantages || "100% Olahan Asli Minangkabau, Renyah Maksimal",
                                    goalType: marketingGoal,
                                    targetAudience,
                                    toneOfVoice: selectedPreset,
                                    price: productPrice,
                                    variationIndex: nextVar,
                                    style: targetAudience === "anak_muda" ? "ramah_santai" : "soft-sell",
                                  }),
                                });
                                const res = await r.json();
                                if (res.success && res.data) setGeneratedCaption(res.data);
                              } catch (err) {
                                console.error("Gagal regenerasi caption:", err);
                              } finally {
                                setIsGeneratingCaption(false);
                              }
                            }}
                            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCaption ? "animate-spin text-blue-600" : ""}`} />
                            <span>{isGeneratingCaption ? "Menghubungi Gemini..." : "Regenerasi Variasi Naskah"}</span>
                          </button>
                        </div>

                        {copyToast && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-in fade-in">
                            ✓ Naskah berhasil disalin ke clipboard!
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ==============================================================
                RIGHT PANEL (GAYA BRANDING & KUESIONER DESAIN AI)
               ============================================================== */}
            <div className="studio-controls w-[310px] shrink-0 flex flex-col gap-5">
              {/* Card Gaya Branding */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-3.5">
                <div className="flex items-center">
                  <h3 className="font-extrabold text-xs text-[#1E2A5E]">Gaya Branding</h3>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Pilih visual tema yang otomatis diaplikasikan pada poster promosi:
                </p>

                {/* 6 Preset Cards Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {PRESET_OPTIONS.map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(preset.id);
                          if (viewMode.startsWith("result")) {
                            runFullAiGenerationPipeline(
                              cutoutImageSrc || currentImageSrc,
                              "result_feed",
                              productName,
                              headlineText,
                              preset.id,
                              Boolean(cutoutImageSrc),
                              marketingGoal,
                              undefined,
                              productPrice,
                              targetAudience,
                              variationCounter
                            );
                          }
                        }}
                        className={`rounded-2xl p-2.5 flex flex-col justify-between h-[74px] text-left transition-all relative border ${
                          isSelected
                            ? "border-[#2563EB] shadow-md ring-2 ring-blue-500/20"
                            : "border-slate-200/80 hover:border-slate-300"
                        }`}
                        style={{
                          background: preset.gradient,
                          color: preset.textColor,
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[9px] font-black uppercase tracking-wider opacity-90">
                            {preset.tag}
                          </span>
                          {isSelected && (
                            <span className="w-3.5 h-3.5 rounded-full bg-white text-[#2563EB] flex items-center justify-center text-[9px] font-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-black leading-tight">{preset.name}</p>
                          <p className="text-[8px] opacity-80 leading-tight">{preset.subtext}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Kuesioner Referensi Desain AI (Pilihan Ganda) */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-[#1E2A5E]">Referensi Desain AI</h3>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Kustom
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Pilih fokus agar AI menyesuaikan angle visual &amp; naskah:
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">Produk dari katalog:</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleCatalogProductChange(e.target.value)}
                    className="w-full text-xs bg-[#F2F3FF] border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="">Pilih produk katalog</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — Rp {Number(product.price).toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pilihan Ganda 1: Tujuan Promosi */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">Tujuan Promosi:</label>
                  <select
                    value={marketingGoal}
                    onChange={(e) => handleMarketingGoalChange(e.target.value)}
                    className="w-full text-xs bg-[#F2F3FF] border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="promo_diskon">🏷️ Diskon / Promo Spesial</option>
                    <option value="produk_baru">✨ Peluncuran Menu Baru</option>
                    <option value="oleh_oleh">🎒 Oleh-Oleh Khas Wisatawan</option>
                    <option value="kualitas">🌿 Kualitas Bahan &amp; Halal</option>
                  </select>
                </div>

                {/* Pilihan Ganda 2: Target Audiens */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">Target Audiens:</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => handleTargetAudienceChange(e.target.value)}
                    className="w-full text-xs bg-[#F2F3FF] border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="wisatawan">✈️ Wisatawan &amp; Perantau Minang</option>
                    <option value="anak_muda">📱 Anak Muda &amp; Pecinta Ngemil</option>
                    <option value="keluarga">👨‍👩‍👧‍👦 Keluarga / Santap Bersama</option>
                  </select>
                </div>
              </div>

              {/* Card Format Ukuran Konten */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-[#1E2A5E]">Format Ukuran Konten</h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Feed Standar
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm">
                    4:5
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-[#1E2A5E]">Feed Komersial Instagram &amp; WA</p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      1080 × 1350 px · Rasio optimal layar penuh smartphone pelanggan
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Pengaturan Tambahan (Toggles) */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-[#1E2A5E]">Pengaturan Tambahan Desain</h3>
                  <span className="text-[10px] font-bold text-slate-400">4 Aktif</span>
                </div>

                {/* Switch 1: AI Color Harmony */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h5 className="font-bold text-xs text-[#1E2A5E]">AI Color Harmony</h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: extractedPalette.dominant }}
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: extractedPalette.accent }}
                      />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                      <span className="text-[10px] text-slate-400 ml-1">4 warna terdeteksi</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={colorHarmony}
                    onChange={(e) => setColorHarmony(e.target.checked)}
                    className="w-4 h-4 text-[#2563EB] rounded cursor-pointer"
                  />
                </div>

                {/* Switch 2: Tampilkan Label Harga */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <h5 className="font-bold text-xs text-[#1E2A5E]">Tampilkan Harga Jual</h5>
                    <p className="text-[10px] text-slate-400">
                      Rp {parseInt(productPrice).toLocaleString("id-ID")} / bks
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="w-4 h-4 text-[#2563EB] rounded cursor-pointer"
                  />
                </div>

                {/* Switch 3: Badge Promo Toko */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <h5 className="font-bold text-xs text-[#1E2A5E]">Badge Promo Diskon</h5>
                    <p className="text-[10px] text-red-600 font-semibold">Aktif: "{badgePromoText}"</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showPromoBadge}
                    onChange={(e) => setShowPromoBadge(e.target.checked)}
                    className="w-4 h-4 text-[#2563EB] rounded cursor-pointer"
                  />
                </div>

                {/* Switch 4: Stempel Halal Resmi */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <h5 className="font-bold text-xs text-[#1E2A5E]">Stempel Halal Resmi</h5>
                    <p className="text-[10px] text-slate-400">Tersertifikasi BPJPH/Kemenag</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={halalStamp}
                    onChange={(e) => setHalalStamp(e.target.checked)}
                    className="w-4 h-4 text-[#2563EB] rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleRegenerateVariation}
                disabled={isComposing}
                className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white rounded-full text-xs font-extrabold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {viewMode.startsWith("result") ? "Regenerasi Desain & Variasi ✨" : "Generate Konten ✨"}
                </span>
              </button>

              {/* Tips UMKM Uni Box */}
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 flex items-start gap-2.5">
                <span className="text-amber-500 text-sm">💡</span>
                <p className="text-[10px] text-amber-900 leading-relaxed">
                  <strong>Tips UMKM Uni:</strong> Format feed 4:5 paling diminati di Instagram karena mengambil ruang layar lebih penuh di smartphone pelanggan!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          MODAL SLIDER PERBANDINGAN SEBELUM/SESUDAH POTONG LATAR (1:1)
         ============================================================== */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#1E2A5E]">
                Perbandingan Sebelum &amp; Sesudah Hapus Latar Belakang
              </h3>
              <button
                onClick={() => setShowCompareModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="relative w-full h-[320px] rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
              {/* Gambar Asli (Sebelum) */}
              <img
                src={currentImageSrc}
                alt="Sebelum"
                className="absolute inset-0 w-full h-full object-contain"
              />

              {/* Gambar Cutout (Sesudah) dipotong dengan clipPath */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 0 0 ${compareSlider}%)` }}
              >
                <img
                  src={cutoutImageSrc || currentImageSrc}
                  alt="Sesudah"
                  className="w-full h-full object-contain filter drop-shadow-2xl"
                  style={{
                    backgroundColor: extractedPalette.background,
                  }}
                />
              </div>

              {/* Garis Pembatas Slider */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)] pointer-events-none"
                style={{ left: `${compareSlider}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shadow-md">
                  ⇄
                </div>
              </div>
            </div>

            {/* Range Input Kontrol Slider */}
            <div className="flex items-center gap-3 px-2">
              <span className="text-xs font-bold text-slate-500">Foto Asli</span>
              <input
                type="range"
                min="0"
                max="100"
                value={compareSlider}
                onChange={(e) => setCompareSlider(Number(e.target.value))}
                className="flex-1 accent-[#2563EB] cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-500">Bersih AI (Transparan)</span>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-5 py-2 bg-[#2563EB] text-white rounded-full text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" aria-label="Memuat AI Studio" />}>
      <StudioContent />
    </Suspense>
  );
}
