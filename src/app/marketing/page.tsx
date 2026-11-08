"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Rocket,
  Compass,
  Tag,
  BookOpen,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  ShoppingBag,
  Star,
  Copy,
  Plus,
  Lock,
  RefreshCw,
  Edit3,
  X,
  AlertCircle,
  Search,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { SANJAI_NAFAMA_BUSINESS, SanjaiProduct } from "@/lib/constants";
import { getLocalProducts, subscribeToProducts } from "@/lib/client-products";

// Struktur Data Opsi Rencana Konten
interface PlanItem {
  id: string;
  goalId?: string;
  dayNumber: number;
  dayName: string;
  scheduledDate: string;
  timeSlot?: string;
  dayTag?: string;
  topic: string;
  contentType: string;
  badge: string;
  description: string;
  recommendedProductId: string;
  productName: string;
  productImageUrl: string;
  productPrice: number;
  status: "planned" | "generated" | "published";
  matchScore?: number;
  isBundle?: boolean;
  secondaryProductId?: string;
  secondaryProductName?: string;
  secondaryProductPrice?: number;
  secondaryProductImageUrl?: string;
}

function MarketingHubContent() {
  const router = useRouter();

  // State Navigasi & Tampilan
  const [currentStep, setCurrentStep] = useState<"setup" | "processing" | "active">("setup");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Form State (Setup View)
  const [selectedGoal, setSelectedGoal] = useState<"promo_diskon" | "product_launch" | "brand_awareness" | "edukasi_pelanggan">("promo_diskon");
  const [productsList, setProductsList] = useState<SanjaiProduct[]>(() => getLocalProducts());
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Processing Animation State
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [processStepText, setProcessStepText] = useState<string>("Menganalisis profil produk tokomu...");

  // Active Strategy State (Database Neon)
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>(SANJAI_NAFAMA_BUSINESS.name);
  const [goalNotes, setGoalNotes] = useState<string | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Modal Edit & Reset State
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // 1. Cek State di Database saat pertama kali dibuka
  useEffect(() => {
    async function initCheck() {
      setIsInitialLoading(true);
      try {
        const [prodRes, plannerRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/marketing/planner"),
        ]);

        const [prodJson, plannerJson] = await Promise.all([
          prodRes.json(),
          plannerRes.json(),
        ]);

        if (prodJson.success && Array.isArray(prodJson.data) && prodJson.data.length > 0) {
          setProductsList(prodJson.data);
        }

        // Cek apakah terdapat strategi 7 hari aktif dari database Neon
        if (
          plannerJson.success &&
          plannerJson.data &&
          Array.isArray(plannerJson.data.items) &&
          plannerJson.data.items.length > 0
        ) {
          setItems(plannerJson.data.items);
          setActiveGoalId(plannerJson.data.goalId);
          if (plannerJson.data.businessName) setBusinessName(plannerJson.data.businessName);
          if (plannerJson.data.goalNotes) setGoalNotes(plannerJson.data.goalNotes);
          if (plannerJson.data.goalType) setSelectedGoal(plannerJson.data.goalType);
          window.localStorage.setItem("umkita:active-marketing-goal", plannerJson.data.goalId);
          setCurrentStep("active");
        } else {
          // Tidak ada strategi aktif di database -> langsung buka Setup View
          window.localStorage.removeItem("umkita:active-marketing-goal");
          window.localStorage.removeItem("umkita:marketing-bootstrap:v1");
          setItems([]);
          setActiveGoalId(null);
          setCurrentStep("setup");
        }
      } catch (err) {
        console.error("Gagal inisialisasi /marketing:", err);
        setCurrentStep("setup");
      } finally {
        setIsInitialLoading(false);
      }
    }

    initCheck();

    const unsub = subscribeToProducts((prods) => {
      if (Array.isArray(prods) && prods.length > 0) {
        setProductsList(prods);
      }
    });
    return () => unsub();
  }, []);

  // 2. Submit Setup Form (Satu Panggilan Tunggal POST /api/marketing/planner/generate)
  const handleStartGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductIds.length === 0) {
      alert("Harap pilih minimal 1 produk utama yang ingin dipromosikan!");
      return;
    }

    setCurrentStep("processing");
    setProcessProgress(20);
    setProcessStepText("Menganalisis produk pilihan dengan katalog tokomu...");

    try {
      const primaryTargetId = selectedProductIds[0] || productsList[0]?.id || "";

      // Satu panggilan tunggal ke endpoint generate yang langsung mengunci data ke Neon DB
      const genPromise = fetch("/api/marketing/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalType: selectedGoal,
          productId: primaryTargetId,
          productIds: selectedProductIds,
          notes: notes.trim() || undefined,
        }),
      }).then((r) => r.json());

      setTimeout(() => {
        setProcessProgress(60);
        setProcessStepText("Menghitung skor relevansi Cosine Similarity & menyusun funnel...");
      }, 700);

      setTimeout(() => {
        setProcessProgress(90);
        setProcessStepText("Mengunci 7 jadwal rekomendasi konten ke database Neon...");
      }, 1400);

      const genJson = await genPromise;

      if (!genJson.success || !genJson.data?.items) {
        throw new Error(genJson.error?.message || "Gagal meracik strategi pemasaran");
      }

      setProcessProgress(100);
      setItems(genJson.data.items);
      setActiveGoalId(genJson.data.goalId);
      if (genJson.data.businessName) setBusinessName(genJson.data.businessName);
      if (genJson.data.goalNotes) setGoalNotes(genJson.data.goalNotes);
      window.localStorage.setItem("umkita:active-marketing-goal", genJson.data.goalId);

      setTimeout(() => {
        setCurrentStep("active");
      }, 400);
    } catch (err: any) {
      console.error("Gagal generate:", err);
      alert(err.message || "Terjadi kendala saat meracik strategi. Silakan coba kembali.");
      setCurrentStep("setup");
    }
  };

  // 3. Handler Ganti Ide Lain (Dinamis Menyesuaikan Produk Baris)
  const handleRegenerateIdea = async (item: PlanItem) => {
    const p = item.productName;
    const priceFmt = `Rp ${item.productPrice.toLocaleString("id-ID")}`;
    const dynamicAlternatives = [
      {
        topic: `Flash Sale Payday: Nikmati Gurih Renyahnya ${p}!`,
        description: `Umumkan promo hemat kilat untuk dorong pesanan borongan ${p} seharga ${priceFmt} via WhatsApp toko.`,
        badge: "Urgensi Diskon",
      },
      {
        topic: `Spill Dapur: Rahasia Bumbu & Kerenyahan ${p}`,
        description: `Teaser bahan segar alami berkualitas yang diolah secara higienis khas resep Padang Ganting.`,
        badge: "Teaser Rasa",
      },
      {
        topic: `Kuis Berhadiah: Tebak Level Kerenyahan ${p}`,
        description: `Interaksi seru di media sosial untuk tingkatkan engagement followers toko dan memenangkan ${p}.`,
        badge: "Interaksi Pelanggan",
      },
      {
        topic: `Teman Santai Keluarga: Stok ${p} di Rumahmu`,
        description: `Ajak pelanggan sediakan ${p} (${priceFmt}) untuk teman santai keluarga atau suguhan tamu di rumah.`,
        badge: "Camilan Favorit",
      },
      {
        topic: `Kirim Nusantara: Garansi Aman & Tetap Renyah untuk ${p}`,
        description: `Tampilkan packing aman bubble wrap tebal dan kardus kokoh untuk pengiriman ${p} ke seluruh Indonesia.`,
        badge: "Kirim Nasional",
      },
    ];

    const currentIndex = dynamicAlternatives.findIndex((alt) => alt.topic === item.topic);
    const nextIdea = dynamicAlternatives[(currentIndex + 1) % dynamicAlternatives.length];

    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, topic: nextIdea.topic, description: nextIdea.description, badge: nextIdea.badge }
          : it
      )
    );

    try {
      await fetch("/api/marketing/planner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          topic: nextIdea.topic,
          description: nextIdea.description,
          goalId: activeGoalId,
        }),
      });
    } catch (e) {
      console.error("Gagal ganti ide:", e);
    }
  };

  // 4. Handler Status Toggle (Dipakai vs Tersedia vs Diposting)
  const handleStatusChange = async (id: string, newStatus: "planned" | "generated" | "published") => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: newStatus } : it))
    );

    try {
      await fetch("/api/marketing/planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, goalId: activeGoalId }),
      });
    } catch (err) {
      console.error("Gagal update status:", err);
    }
  };

  // 5. Handler Simpan Edit Manual
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      setIsSavingEdit(true);
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingItem.id ? { ...it, topic: editTopic, description: editDesc } : it
        )
      );

      await fetch("/api/marketing/planner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          topic: editTopic,
          description: editDesc,
          goalId: activeGoalId,
        }),
      });

      setEditingItem(null);
    } catch (err) {
      console.error("Gagal update manual:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 6. Reset / Batalkan Strategi Aktif (Bersihkan DB & LocalStorage Tuntas)
  const handleConfirmReset = async () => {
    try {
      if (activeGoalId) {
        await fetch(`/api/marketing/planner?goalId=${encodeURIComponent(activeGoalId)}`, {
          method: "DELETE",
        });
      } else {
        await fetch("/api/marketing/planner", {
          method: "DELETE",
        });
      }
    } catch (e) {
      console.warn("Gagal delete strategi aktif di server:", e);
    }

    // Bersihkan seluruh referensi di localStorage
    window.localStorage.removeItem("umkita:active-marketing-goal");
    window.localStorage.removeItem("umkita:marketing-bootstrap:v1");

    setShowResetModal(false);
    setSelectedProductIds([]);
    setNotes("");
    setActiveGoalId(null);
    setItems([]);
    setCurrentStep("setup");
    router.replace("/marketing");
  };

  const handleCopyCaption = () => {
    const text = `Rasa asli Minang dengan harga spesial minggu ini! Pesan langsung via WhatsApp ${SANJAI_NAFAMA_BUSINESS.whatsapp} #KulinerMinang #OlehOlehPadang #UMKMJuara #DiskonSanjai`;
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const generatedCount = items.filter((x) => x.status === "generated").length;
  const publishedCount = items.filter((x) => x.status === "published").length;

  if (isInitialLoading) {
    return (
      <AppLayout>
        <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8FF]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-4 border-[#004AC6] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">Memeriksa status strategi di database Neon...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* =====================================================================
          STATE 1: SETUP TARGET & PRODUK (Hanya jika belum ada strategi aktif)
         ===================================================================== */}
      {currentStep === "setup" && (
        <main className="flex-1 px-4 sm:px-6 lg:px-10 pt-8 pb-28">
          <div className="w-full max-w-[1440px] mx-auto">
            {/* Header Title */}
            <div className="flex flex-col gap-1.5 mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#004AC6] text-[11px] font-bold w-fit shadow-xs mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Strategi Pemasaran UMKM • Sanjai Nafama</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#131B2E]">
                Racik Strategi Pemasaran Tokomu
              </h1>
              <p className="text-xs sm:text-sm text-[#434655] font-medium max-w-xl">
                Pilih produk unggulan yang ingin kamu dorong penjualannya pekan ini. Sistem akan mencocokkan ide konten dengan tren pembeli secara otomatis.
              </p>
            </div>

            {/* Form Input */}
            <form onSubmit={handleStartGenerate} className="space-y-6">
              {/* PILIHAN 1: TARGET PROMOSI */}
              <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-sm font-extrabold text-[#131B2E] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#004AC6] text-white text-xs flex items-center justify-center font-bold">1</span>
                    <span>Pilih Tujuan Promosi Pekan Ini</span>
                  </h2>
                  <p className="text-xs text-[#434655] mt-1 pl-8">
                    Sesuaikan dengan momentum tokomu saat ini agar gaya bahasa konten tepat sasaran.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-8">
                  {[
                    { id: "promo_diskon", label: "Promo Diskon Kilat", desc: "Dorong pesanan borongan via WhatsApp dengan penawaran hemat.", icon: Tag, color: "text-amber-600", bg: "bg-amber-50" },
                    { id: "product_launch", label: "Peluncuran Produk Baru", desc: "Kenalkan kemasan atau varian rasa baru ke pelanggan setia.", icon: Rocket, color: "text-blue-600", bg: "bg-blue-50" },
                    { id: "brand_awareness", label: "Kenalkan Ciri Khas Brand", desc: "Tampilkan keaslian resep Padang Ganting & bahan baku pilihan.", icon: Compass, color: "text-purple-600", bg: "bg-purple-50" },
                    { id: "edukasi_pelanggan", label: "Edukasi & Tips Penyimpanan", desc: "Berikan tips agar keripik tetap renyah tahan lama berminggu-minggu.", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
                  ].map((g) => {
                    const Icon = g.icon;
                    const isSelected = selectedGoal === g.id;
                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGoal(g.id as any)}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? "bg-blue-50/50 border-[#004AC6] shadow-sm ring-2 ring-blue-500/10"
                            : "bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${g.bg} shrink-0`}>
                          <Icon className={`w-5 h-5 ${g.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-xs font-black ${isSelected ? "text-[#004AC6]" : "text-[#131B2E]"}`}>
                              {g.label}
                            </h3>
                            {isSelected && <Check className="w-4 h-4 text-[#004AC6] stroke-[3]" />}
                          </div>
                          <p className="text-[11px] text-[#434655] mt-0.5 leading-relaxed">
                            {g.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PILIHAN 2: PRODUK UNGGULAN TOKO (MULTI-SELECT) */}
              <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#131B2E] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#004AC6] text-white text-xs flex items-center justify-center font-bold">2</span>
                      <span>Pilih Produk Utama yang Ingin Digenjot</span>
                    </h2>
                    <p className="text-xs text-[#434655] mt-1 pl-8">
                      Bisa pilih lebih dari satu produk! Produk terpilih akan dipromosikan bergantian sepanjang minggu.
                    </p>
                  </div>

                  <div className="pl-8 sm:pl-0">
                    {selectedProductIds.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#004AC6] text-xs font-bold shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#004AC6]" />
                        <span>{selectedProductIds.length} Produk Terpilih</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold shadow-xs">
                        <span>Belum ada produk dipilih</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Search Input Filter for Marketing Products */}
                <div className="pl-0 sm:pl-8 flex items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Cari produk katalog..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#004AC6]"
                    />
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => setProductSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {productSearch && (
                    <span className="text-[11px] font-medium text-slate-500">
                      Ditemukan {productsList.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).length} produk
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pl-0 sm:pl-8">
                  {productsList
                    .filter((prod) =>
                      !productSearch.trim() ||
                      prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      (prod.description && prod.description.toLowerCase().includes(productSearch.toLowerCase()))
                    )
                    .map((prod) => {
                      const isSelected = selectedProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSelectedProductIds((prev) =>
                              prev.includes(prod.id)
                                ? prev.filter((id) => id !== prod.id)
                                : [...prev, prod.id]
                            );
                          }}
                          className={`cursor-pointer rounded-2xl p-3 border transition-all flex flex-col justify-between relative select-none ${
                            isSelected
                              ? "bg-blue-50/70 border-[#004AC6] shadow-sm ring-2 ring-blue-500/20 scale-[1.01]"
                              : "bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="relative mb-2.5">
                            <img
                              src={prod.originalImageUrl || "/produk/produk1.jpeg"}
                              alt={prod.name}
                              className="w-full h-28 object-cover rounded-xl bg-slate-100"
                            />
                            {isSelected ? (
                              <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#004AC6] text-white flex items-center justify-center shadow-md animate-in zoom-in-75 duration-100">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 border border-slate-300 text-transparent flex items-center justify-center hover:border-[#004AC6]">
                                <Plus className="w-3.5 h-3.5 text-slate-400" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-black text-[#131B2E] line-clamp-1">{prod.name}</p>
                              {isSelected && (
                                <span className="text-[10px] font-extrabold text-[#004AC6] shrink-0">
                                  Terpilih
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-extrabold text-amber-700 mt-0.5">
                              Rp {Number(prod.price).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* PILIHAN 3: CATATAN TAMBAHAN TOKO */}
              <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-3">
                <div>
                  <h2 className="text-sm font-extrabold text-[#131B2E] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#004AC6] text-white text-xs flex items-center justify-center font-bold">3</span>
                    <span>Catatan Khusus Toko (Opsional)</span>
                  </h2>
                  <p className="text-xs text-[#434655] mt-1 pl-8">
                    Ada promo khusus atau stok tertentu yang ingin disorot? Tuliskan singkat di sini.
                  </p>
                </div>
                <div className="pl-0 sm:pl-8">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Stok cabai melimpah, ada bonus gratis ongkir se-Sumbar..."
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 outline-none font-medium text-[#131B2E]"
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={selectedProductIds.length === 0}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                    selectedProductIds.length === 0
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-[#004AC6] hover:bg-blue-700 text-white hover:shadow-lg"
                  }`}
                >
                  <span>Racik Rekomendasi Konten</span>
                  <Sparkles className={`w-4 h-4 ${selectedProductIds.length === 0 ? "text-slate-400" : "text-amber-300"}`} />
                </button>
              </div>
            </form>
          </div>
        </main>
      )}

      {/* =====================================================================
          STATE 2: TRANSISI PEMROSESAN CERDAS (2-3 detik)
         ===================================================================== */}
      {currentStep === "processing" && (
        <main className="flex-1 bg-gradient-to-b from-[#EAF4FF] to-[#D6EBFF] px-4 pt-12 pb-24 flex items-center justify-center min-h-[75vh]">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col items-center text-center max-w-md w-full space-y-6">
            <div className="relative">
              <img
                src="/assets/MIMO_Gerak.gif"
                alt="Mimo"
                className="w-24 h-24 object-contain animate-bounce"
                style={{ animationDuration: "2.5s" }}
              />
              <span className="absolute -top-1 -right-2 text-xl">✨</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#131B2E]">
                Meracik Strategi Konten Toko
              </h2>
              <p className="text-xs text-[#434655] font-medium">
                {processStepText}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-2">
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                <div
                  style={{ width: `${processProgress}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-[#004AC6] rounded-full transition-all duration-300"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-1">
                <span>Pencocokan Katalog</span>
                <span className="text-[#004AC6]">{processProgress}%</span>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 gap-2 text-left">
              {[
                "Analisis Produk",
                "Hitung Skor Relevansi",
                "Kunci Jadwal di Neon DB",
              ].map((step, index) => {
                const complete = processProgress >= [20, 60, 90][index];
                return (
                  <div key={step} className={`rounded-xl border p-2 text-[10px] font-bold ${complete ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-400"}`}>
                    <span className="mr-1">{complete ? "✓" : `${index + 1}.`}</span>{step}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          STATE 3: BANK IDE REKOMENDASI TERKUNCI (Active View 7 Hari)
         ===================================================================== */}
      {currentStep === "active" && (
        <main className="flex-1 bg-gradient-to-b from-[#EAF4FF] to-[#D6EBFF] px-3 sm:px-6 lg:px-8 pt-6 pb-20">
          <div className="w-full max-w-[1440px] mx-auto space-y-4 sm:space-y-5">
            {/* TOP HEADER TITLE & ACTION BUTTONS (Tanpa sticky ganda) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131B2E]">
                    Rekomendasi Konten Promosi
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black shadow-xs">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Strategi Aktif di Database</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#434655] mt-1 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#004AC6]" />
                  <span>
                    Target:{" "}
                    <strong className="text-[#131B2E]">
                      {selectedGoal === "brand_awareness"
                        ? "Kenalkan Brand"
                        : selectedGoal === "promo_diskon"
                        ? "Promo Diskon"
                        : selectedGoal === "product_launch"
                        ? "Peluncuran Baru"
                        : "Edukasi Pelanggan"}
                    </strong>{" "}
                    • {businessName}
                    {goalNotes ? ` ("${goalNotes}")` : ""}
                  </span>
                </p>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Toggle Mode: Opsi List / Opsi Grid */}
                <div className="p-1 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      viewMode === "list" ? "bg-[#004AC6] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Daftar Opsi</span>
                  </button>
                  <button
                    onClick={() => setViewMode("card")}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      viewMode === "card" ? "bg-[#004AC6] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Kartu Grid</span>
                  </button>
                </div>

                {/* Tombol Buat Strategi Baru */}
                <button
                  onClick={() => setShowResetModal(true)}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                >
                  Ubah Sasaran / Buat Baru
                </button>
              </div>
            </div>

            {/* PROGRES REKOMENDASI BANNER */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#004AC6] animate-pulse" />
                  <h3 className="font-extrabold text-sm sm:text-base text-[#131B2E]">
                    Status Eksekusi: <span className="text-[#004AC6]">{generatedCount + publishedCount} dari {items.length} Ide Terpilih</span>
                  </h3>
                </div>
                <p className="text-xs text-[#434655] font-medium">
                  Pilih ide konten yang paling cocok dengan stok tokomu hari ini. Kamu bebas mengganti variasi ide atau langsung membuatnya di Studio!
                </p>
              </div>

              <div className="flex items-center gap-3 sm:min-w-[220px]">
                <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    style={{ width: `${items.length > 0 ? ((generatedCount + publishedCount) / items.length) * 100 : 0}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-[#004AC6] rounded-full transition-all duration-500"
                  />
                </div>
                <span className="text-xs font-black text-[#004AC6] min-w-[38px] text-right">
                  {items.length > 0 ? Math.round(((generatedCount + publishedCount) / items.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* BAR PRODUK MINGGU INI */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 sm:px-4 sm:py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-[#434655] flex items-center gap-1.5 mr-1">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span>Produk Utama:</span>
                </span>

                {Array.from(
                  new Map(items.map((it) => [it.recommendedProductId || it.productName, it])).values()
                ).map((it, idx) => (
                  <span
                    key={it.recommendedProductId || idx}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
                      idx === 0
                        ? "bg-amber-50 border-amber-200 text-[#131B2E]"
                        : "bg-blue-50 border-blue-200 text-blue-900 font-semibold"
                    }`}
                  >
                    <img
                      src={it.productImageUrl || "/produk/produk1.jpeg"}
                      alt={it.productName}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{it.productName}</span>
                    {idx === 0 ? (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    ) : (
                      <span className="text-[10px] text-blue-600 font-bold ml-0.5 bg-blue-100/60 px-1.5 py-0.2 rounded-full">
                        Pilihan {idx + 1}
                      </span>
                    )}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setShowResetModal(true)}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5"
              >
                <Edit3 className="w-3 h-3 text-slate-500" />
                <span>Ubah Target</span>
              </button>
            </div>

            {/* CARD PESAN UTAMA */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold tracking-wider text-amber-800 uppercase flex items-center gap-1">
                  <span>📍 PESAN UTAMA PROMOSI:</span>
                </span>
                
                <h2 className="text-lg sm:text-xl font-black italic text-[#131B2E] leading-snug">
                  “Rasa asli Minang dengan harga spesial minggu ini”
                </h2>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {["#KulinerMinang", "#OlehOlehPadang", "#UMKMJuara", "#DiskonSanjai", "#SanjaiNafama"].map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-blue-50 text-[#004AC6] border border-blue-100 text-[10px] font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCopyCaption}
                className="shrink-0 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all self-start md:self-center"
              >
                {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedCaption ? "Tersalin ke Clipboard!" : "Salin Pesan Utama"}</span>
              </button>
            </div>

            {/* =================================================================
                TAMPILAN 1: DAFTAR OPSI REKOMENDASI (LIST VIEW)
               ================================================================= */}
            {viewMode === "list" && (
              <div className="space-y-3">
                {items.map((item) => {
                  const isDone = item.status === "generated" || item.status === "published";
                  const studioUrl = `/studio?planId=${encodeURIComponent(item.id)}&productId=${encodeURIComponent(item.recommendedProductId)}&goal=${encodeURIComponent(selectedGoal)}&topic=${encodeURIComponent(item.topic)}&auto=true`;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition-all p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                        isDone
                          ? "bg-white/80 border-slate-200"
                          : "bg-white border-[#E2E8F0] shadow-sm hover:border-blue-300"
                      }`}
                    >
                      {/* Left Block: Day Badge & Info */}
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        {/* Day Counter */}
                        <div className="w-12 h-12 rounded-2xl bg-[#004AC6]/10 border border-[#004AC6]/20 flex flex-col items-center justify-center shrink-0 text-center">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#004AC6]">
                            HARI
                          </span>
                          <span className="text-base font-black text-[#004AC6] leading-none">
                            {item.dayNumber}
                          </span>
                        </div>

                        {/* Text Detail */}
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">
                              {item.dayName}, {item.scheduledDate}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#004AC6] border border-blue-200 text-[10px] font-bold">
                              {item.badge}
                            </span>
                            {item.isBundle && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold flex items-center gap-1">
                                <span>📦 Paket Bundling</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-black text-[#131B2E] tracking-tight">
                            {item.topic}
                          </h3>

                          <p className="text-xs text-[#434655] font-medium line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Middle Block: Product Badge Info */}
                      <div className="flex items-center gap-2.5 py-1 px-3 rounded-xl bg-slate-50 border border-slate-200 self-start lg:self-center shrink-0">
                        <img
                          src={item.productImageUrl || "/produk/produk1.jpeg"}
                          alt={item.productName}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div className="text-left">
                          <p className="text-[11px] font-bold text-[#131B2E] line-clamp-1 max-w-[140px]">
                            {item.productName}
                          </p>
                          <p className="text-[10px] font-extrabold text-amber-700">
                            Rp {item.productPrice.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>

                      {/* Right Block: Action Controls */}
                      <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                        {/* Status Toggle Button */}
                        <button
                          onClick={() =>
                            handleStatusChange(
                              item.id,
                              item.status === "planned"
                                ? "generated"
                                : item.status === "generated"
                                ? "published"
                                : "planned"
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            item.status === "published"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : item.status === "generated"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.status === "published" ? "bg-purple-600" : item.status === "generated" ? "bg-emerald-600" : "bg-slate-400"
                          }`} />
                          <span>
                            {item.status === "published"
                              ? "Sudah Diposting"
                              : item.status === "generated"
                              ? "Sudah Dibuat"
                              : "Tersedia"}
                          </span>
                        </button>

                        {/* Ganti Variasi Ide Button */}
                        <button
                          onClick={() => handleRegenerateIdea(item)}
                          title="Ganti variasi ide konten lain"
                          className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-[#004AC6] border border-slate-200 hover:border-blue-200 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Manual Button */}
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditTopic(item.topic);
                            setEditDesc(item.description);
                          }}
                          title="Edit topik & deskripsi manual"
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Buka di AI Studio Button (Parameter Lengkap) */}
                        <Link
                          href={studioUrl}
                          className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[#004AC6] hover:bg-blue-700 shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <span>Studio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* =================================================================
                TAMPILAN 2: KARTU GRID REKOMENDASI (CARD VIEW)
               ================================================================= */}
            {viewMode === "card" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item) => {
                  const studioUrl = `/studio?planId=${encodeURIComponent(item.id)}&productId=${encodeURIComponent(item.recommendedProductId)}&goal=${encodeURIComponent(selectedGoal)}&topic=${encodeURIComponent(item.topic)}&auto=true`;

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
                    >
                      <div className="space-y-3">
                        {/* Day Tag & Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-[#004AC6] text-white text-xs flex items-center justify-center font-bold">
                              {item.dayNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-600">{item.dayName}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#004AC6] text-[10px] font-bold border border-blue-200">
                            {item.badge}
                          </span>
                        </div>

                        {/* Product Image & Title */}
                        <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                          <img
                            src={item.productImageUrl || "/produk/produk1.jpeg"}
                            alt={item.productName}
                            className="w-full h-36 object-cover"
                          />
                          <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-white/95 backdrop-blur-xs border border-slate-200/80 flex items-center justify-between">
                            <p className="text-xs font-bold text-[#131B2E] line-clamp-1">{item.productName}</p>
                            <span className="text-[11px] font-black text-amber-700">Rp {item.productPrice.toLocaleString("id-ID")}</span>
                          </div>
                        </div>

                        {/* Topic & Description */}
                        <div>
                          <h3 className="text-sm font-black text-[#131B2E] line-clamp-2 leading-snug">
                            {item.topic}
                          </h3>
                          <p className="text-xs text-[#434655] font-medium line-clamp-3 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link
                          href={studioUrl}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#004AC6] hover:bg-blue-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>Studio AI</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleRegenerateIdea(item)}
                          title="Ganti ide"
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditTopic(item.topic);
                            setEditDesc(item.description);
                          }}
                          title="Edit"
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {/* =====================================================================
          MODAL RESET / BATALKAN STRATEGI (Pembersihan Tuntas)
         ===================================================================== */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#131B2E]">Ganti Target Strategi?</h3>
                <p className="text-xs text-[#434655] mt-0.5">
                  Strategi aktif akan direset dari database dan kamu dapat meracik sasaran promosi baru dari formulir awal.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all"
              >
                Ya, Reset & Buat Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL EDIT TOPIK & DESKRIPSI MANUAL
         ===================================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#004AC6] text-white font-extrabold text-xs flex items-center justify-center">
                  #{editingItem.dayNumber}
                </span>
                <h3 className="font-bold text-base text-[#131B2E]">
                  Edit Opsi Rekomendasi
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Topik Ide Konten
                </label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-[#131B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Arahan Visual & Copywriting
                </label>
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 outline-none text-[#434655] leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-[#004AC6] hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function MarketingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#EAF4FF]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-4 border-[#004AC6] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">Memuat Strategi Pemasaran...</p>
          </div>
        </div>
      }
    >
      <MarketingHubContent />
    </Suspense>
  );
}
