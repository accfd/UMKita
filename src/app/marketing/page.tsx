"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  AlertCircle
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { SANJAI_NAFAMA_PRODUCTS, SANJAI_NAFAMA_BUSINESS, SanjaiProduct } from "@/lib/constants";

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

// Bank Ide Alternatif untuk Penggantian Ide Cepat (Anti-Slop & Human Copy)
const ALTERNATIVE_IDEAS: Record<number, Array<{ topic: string; description: string; badge: string }>> = {
  1: [
    { topic: "Flash Sale Sanjai Balado Payday 20%", description: "Umumkan promo hemat kilat untuk dorong pesanan borongan via WhatsApp toko.", badge: "Urgensi Diskon" },
    { topic: "Spill Resep Pedas Manis Balado Sanjai Nafama", description: "Teaser cabai merah asli segar yang dimasak karamel tanpa pewarna buatan.", badge: "Teaser Rasa" },
    { topic: "Kuis Tebak Level Pedas Balado Berhadiah Snack", description: "Interaksi seru di story Instagram untuk tingkatkan engagement followers toko.", badge: "Interaksi Pelanggan" }
  ],
  2: [
    { topic: "Cerita Dapur: Cabai Segar Asli Petani Padang Ganting", description: "Perlihatkan proses pemilihan cabai segar lokal Tanah Datar yang digiling dadakan.", badge: "Kepercayaan Produk" },
    { topic: "Di Balik Renyahnya Singkong Pilihan Tanah Datar", description: "Edukasi jenis singkong pulen yang diiris tipis presisi untuk hasil super kriuk.", badge: "Dapur Tradisi" },
    { topic: "Higienis & Tradisional: Menggoreng dengan Kuali Asli", description: "Sorot kebersihan dapur produksi dan minyak kelapa jernih yang selalu baru.", badge: "Standar Kebersihan" }
  ],
  3: [
    { topic: "Video Suara Kriuk Renyah Sanjai Kuning Original (ASMR)", description: "Audio visual gigitan pertama yang renyah tanpa teks berlebihan untuk TikTok & Reels.", badge: "Sensori & ASMR" },
    { topic: "Sensasi Gurih Kunyit Bawang Khas Minang", description: "Close-up bumbu kuning gurih rempah alami yang meresap sempurna ke dalam keripik.", badge: "Sorotan Rasa" },
    { topic: "Kenapa Sanjai Nafama Tetap Renyah 3 Bulan?", description: "Tips penyimpanan kedap udara agar oleh-oleh tetap garing seperti baru digoreng.", badge: "Edukasi Produk" }
  ],
  4: [
    { topic: "Paket Combo Manis Pedas: Sanjai Balado + Kue Angka Delapan", description: "Bundel hemat perpaduan pedas nampol keripik balado dan manis legit kue angka 8.", badge: "Paket Bundling" },
    { topic: "Paket Oleh-Oleh Komplit Mudik: 3 Varian Best Seller", description: "Penawaran paket kardus praktis siap kirim berisi Sanjai Balado, Kuning, & Karak Kaliang.", badge: "Paket Komplit" },
    { topic: "Beli 3 Lebih Hemat: Bebas Pilih Varian Favorit", description: "Dorong nilai keranjang belanja lebih tinggi dengan diskon bundling bertingkat.", badge: "Promo Volume" }
  ],
  5: [
    { topic: "Promo Spesial Hari Ini: Gratis Ongkir Khusus Order WA", description: "Ajak calon pembeli langsung chat admin dengan format pemesanan cepat.", badge: "Order Kilat WA" },
    { topic: "Voucher Diskon Spesial Khusus Pelanggan Setia", description: "Apresiasi pembeli loyal dengan kode kupon potongan langsung untuk repeat order.", badge: "Loyalitas Pelanggan" },
    { topic: "Pengiriman Kilat Seluruh Nusantara: Garansi Anti Remuk", description: "Tampilkan kemasan kardus tebal dan bubble wrap aman untuk pengiriman luar kota.", badge: "Kirim Nasional" }
  ],
  6: [
    { topic: "Oleh-Oleh Favorit Wisatawan Singgah Padang Ganting", description: "Kompilasi foto ulasan pembeli yang membawa Sanjai Nafama sebagai buah tangan.", badge: "Ulasan Pembeli" },
    { topic: "Rating 5.0 dari Perantau Minang di Jakarta & Bandung", description: "Kutipan chat WhatsApp kepuasan perantau yang rindu cita rasa kampung halaman.", badge: "Bukti Sosial" },
    { topic: "Unboxing Paket Sanjai Nafama: Kemasan Rapi & Masih Hangat", description: "Video reaksi pelanggan saat membuka paket pesanan yang sampai di rumah.", badge: "Unboxing Pelanggan" }
  ],
  7: [
    { topic: "Hitung Mundur: Jam Terakhir Promo Paket Hemat Pekan Ini", description: "Bangkitkan urgensi FOMO sebelum harga kembali normal tengah malam ini.", badge: "Closing Terakhir" },
    { topic: "Stok Batch Gorengan Hari Ini Sisa 15 Bungkus Lagi!", description: "Tunjukkan bahwa produk dibuat fresh setiap hari dan cepat habis terjual.", badge: "Stok Terbatas" },
    { topic: "Terima Kasih Atas 200+ Pesanan Pekan Ini!", description: "Ungkapan rasa syukur toko yang meningkatkan reputasi dan kehangatan brand.", badge: "Apresiasi Pembeli" }
  ]
};

function MarketingHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlGoalId = searchParams.get("goalId");

  // State Navigasi & Tampilan
  const [currentStep, setCurrentStep] = useState<"setup" | "processing" | "active">("setup");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Form State (State 1)
  const [selectedGoal, setSelectedGoal] = useState<"promo_diskon" | "product_launch" | "brand_awareness" | "edukasi_pelanggan">("promo_diskon");
  const [productsList, setProductsList] = useState<SanjaiProduct[]>(SANJAI_NAFAMA_PRODUCTS);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  // Processing Animation State (State 2)
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [processStepText, setProcessStepText] = useState<string>("Menganalisis profil produk tokomu...");

  // Active Strategy State (State 3 - Neon DB)
  const [activeGoalId, setActiveGoalId] = useState<string | null>(urlGoalId);
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
      try {
        setIsInitialLoading(true);

        // Ambil daftar produk dari Neon DB
        try {
          const prodRes = await fetch("/api/products");
          const prodJson = await prodRes.json();
          if (prodJson.success && prodJson.data?.length > 0) {
            setProductsList(prodJson.data);
          }
        } catch (e) {
          console.warn("Notice fetch products:", e);
        }

        // Cek apakah ada strategi aktif di DB
        const plannerUrl = urlGoalId 
          ? `/api/marketing/planner?goalId=${encodeURIComponent(urlGoalId)}`
          : `/api/marketing/planner`;

        const res = await fetch(plannerUrl);
        const json = await res.json();

        if (json.success && json.data?.items?.length > 0 && json.data?.source === "database_neon") {
          setItems(json.data.items);
          setActiveGoalId(json.data.goalId);
          if (json.data.businessName) setBusinessName(json.data.businessName);
          if (json.data.goalNotes) setGoalNotes(json.data.goalNotes);
          if (json.data.goalType) setSelectedGoal(json.data.goalType);
          setCurrentStep("active");
        } else {
          setCurrentStep("setup");
        }
      } catch (err) {
        console.error("Gagal inisialisasi:", err);
        setCurrentStep("setup");
      } finally {
        setIsInitialLoading(false);
      }
    }

    initCheck();
  }, [urlGoalId]);

  // 2. Submit Setup Form (State 1 -> State 2 -> State 3)
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

      // Buat sasaran baru di /api/marketing/recommend
      const recRes = await fetch("/api/marketing/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalType: selectedGoal,
          targetProductId: primaryTargetId,
          targetProductIds: selectedProductIds,
          notes: notes.trim() || undefined
        })
      });
      const recJson = await recRes.json();
      const newGoalId = recJson.data?.goalId || `goal-${Date.now()}`;
      setActiveGoalId(newGoalId);

      setProcessProgress(60);
      setProcessStepText("Menghitung skor relevansi Cosine Similarity & menyusun funnel...");

      // Generate & Kunci 7 Opsi di /api/marketing/planner/generate
      const genRes = await fetch("/api/marketing/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: newGoalId,
          goalType: selectedGoal,
          productId: primaryTargetId,
          productIds: selectedProductIds,
          forceRegenerate: true
        })
      });
      const genJson = await genRes.json();

      setProcessProgress(90);
      setProcessStepText("Mengunci bank ide rekomendasi di database...");

      setTimeout(() => {
        setProcessProgress(100);
        if (genJson.success && genJson.data?.items) {
          setItems(genJson.data.items);
        }
        setTimeout(() => {
          setCurrentStep("active");
        }, 400);
      }, 500);

    } catch (err) {
      console.error("Gagal generate:", err);
      setCurrentStep("active");
    }
  };

  // 3. Handler Ganti Ide Lain (Model A)
  const handleRegenerateIdea = async (item: PlanItem) => {
    const list = ALTERNATIVE_IDEAS[item.dayNumber] || ALTERNATIVE_IDEAS[1];
    const currentIndex = list.findIndex((alt) => alt.topic === item.topic);
    const nextIdea = list[(currentIndex + 1) % list.length];

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
          goalId: activeGoalId
        })
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
        body: JSON.stringify({ id, status: newStatus, goalId: activeGoalId })
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
          goalId: activeGoalId
        })
      });

      setEditingItem(null);
    } catch (err) {
      console.error("Gagal update manual:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 6. Reset Strategi untuk Buat Baru
  const handleConfirmReset = () => {
    setShowResetModal(false);
    setSelectedProductIds([]);
    setNotes("");
    setCurrentStep("setup");
  };

  const handleCopyCaption = () => {
    const text = `Rasa asli Minang dengan harga spesial minggu ini! Pesan langsung via WhatsApp ${SANJAI_NAFAMA_BUSINESS.whatsapp} #KulinerMinang #OlehOlehPadang #UMKMJuara #DiskonSanjai`;
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const selectedProduct = productsList.find((p) => selectedProductIds.includes(p.id)) || productsList[0];
  const generatedCount = items.filter((x) => x.status === "generated").length;
  const publishedCount = items.filter((x) => x.status === "published").length;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-[#004AC6] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-600">Memeriksa status strategi tokomu...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* =====================================================================
          STATE 1: SETUP TARGET & PRODUK (Hanya jika belum ada strategi aktif)
         ===================================================================== */}
        {currentStep === "setup" && (
          <main className="flex-1 px-4 sm:px-6 lg:px-10 pt-8 pb-28">
            <div className="max-w-[880px] mx-auto">
              
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
                      { id: "edukasi_pelanggan", label: "Edukasi & Tips Penyimpanan", desc: "Berikan tips agar keripik tetap renyah tahan lama berminggu-minggu.", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" }
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

                {/* PILIHAN 2: PRODUK UNGGULAN TOKO (BISA PILIH LEBIH DARI SATU) */}
                <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-extrabold text-[#131B2E] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#004AC6] text-white text-xs flex items-center justify-center font-bold">2</span>
                        <span>Pilih Produk Utama yang Ingin Digenjot</span>
                      </h2>
                      <p className="text-xs text-[#434655] mt-1 pl-8">
                        Bisa pilih lebih dari satu produk! Produk-produk terpilih akan dipromosikan bergantian sepanjang minggu.
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pl-0 sm:pl-8">
                    {productsList.map((prod) => {
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
          <main className="flex-1 bg-gradient-to-b from-[#EAF4FF] to-[#D6EBFF] px-4 pt-12 pb-24 flex items-center justify-center">
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

            </div>
          </main>
        )}

        {/* =====================================================================
            STATE 3: BANK IDE REKOMENDASI TERKUNCI (Active Repository)
           ===================================================================== */}
        {currentStep === "active" && (
          <main className="flex-1 bg-gradient-to-b from-[#EAF4FF] to-[#D6EBFF] px-3 sm:px-6 lg:px-8 pt-6 pb-20">
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
              
              {/* TOP HEADER TITLE & ACTION BUTTONS */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131B2E]">
                      Rekomendasi Konten Promosi
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black shadow-xs">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Strategi Aktif</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[#434655] mt-1 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#004AC6]" />
                    <span>Target: <strong className="text-[#131B2E]">{selectedGoal === "brand_awareness" ? "Kenalkan Brand" : selectedGoal === "promo_diskon" ? "Promo Diskon" : selectedGoal === "product_launch" ? "Peluncuran Baru" : "Edukasi Pelanggan"}</strong> • {businessName}</span>
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
                    ← Ganti Target
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

                  {goalNotes && (
                    <p className="text-xs text-slate-500 pt-0.5 italic">
                      Catatan Toko: "{goalNotes}"
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-all flex items-center gap-2 shrink-0 self-start md:self-center"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Salin Caption</span>
                    </>
                  )}
                </button>
              </div>

              {/* ========================================================
                  KONDISI 1: TAMPILAN BANK IDE (Model A: Daftar Opsi)
                 ======================================================== */}
              {viewMode === "list" && (
                <div className="space-y-3.5">
                  {items.map((item) => {
                    const isSelected = item.status === "generated" || item.status === "published";
                    const isCompleted = item.status === "published";
                    const studioUrl = `/studio?planId=${encodeURIComponent(item.id)}&productId=${encodeURIComponent(item.recommendedProductId)}&goal=${encodeURIComponent(selectedGoal)}&topic=${encodeURIComponent(item.topic)}`;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl p-4 sm:p-5 transition-all border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isCompleted
                            ? "bg-slate-50/70 border-slate-200 opacity-80"
                            : isSelected
                            ? "bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm"
                            : "bg-white border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md"
                        }`}
                      >
                        {/* Left Section: Opsi Badge + Title & Desc */}
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, isCompleted ? "planned" : isSelected ? "published" : "generated")}
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all font-black text-xs ${
                              isCompleted
                                ? "bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100"
                                : isSelected
                                ? "bg-[#004AC6] text-white shadow-sm ring-4 ring-blue-100"
                                : "bg-slate-100 border border-slate-300 text-slate-700 hover:border-[#004AC6] hover:bg-blue-50"
                            }`}
                            title={isCompleted ? "Klik untuk reset status" : isSelected ? "Klik untuk tandai sudah diposting" : "Klik untuk pilih ide ini"}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <span>#{item.dayNumber}</span>
                            )}
                          </button>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-black text-[#131B2E] uppercase tracking-wide bg-slate-100 px-2.5 py-0.5 rounded-md">
                                OPSI {item.dayNumber}
                              </span>

                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                                {item.badge}
                              </span>

                              {item.matchScore && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  Cocok {item.matchScore}%
                                </span>
                              )}

                              {isCompleted ? (
                                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Sudah Diposting</span>
                                </span>
                              ) : isSelected ? (
                                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Ide Terpilih</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  Tersedia
                                </span>
                              )}
                            </div>

                            <h3 className={`font-black text-sm sm:text-base leading-snug transition-colors ${
                              isCompleted ? "line-through text-slate-400" : "text-[#131B2E]"
                            }`}>
                              {item.topic}
                            </h3>

                            <p className={`text-xs leading-relaxed ${
                              isCompleted ? "text-slate-400" : "text-[#434655]"
                            }`}>
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Right Section: Product Chip (Duo Bundling jika paket combo) + Actions */}
                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                          {item.isBundle && item.secondaryProductName ? (
                            /* TAMPILAN KHUSUS PAKET COMBO: DUA PRODUK JELAS */
                            <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs">
                              <div className="flex items-center gap-1.5 pr-2 border-r border-amber-200/80">
                                <img
                                  src={item.productImageUrl}
                                  alt={item.productName}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 bg-white"
                                />
                                <div className="max-w-[110px]">
                                  <p className="text-[11px] font-extrabold text-[#131B2E] truncate leading-tight">
                                    {item.productName}
                                  </p>
                                  <p className="text-[10px] font-bold text-amber-700">
                                    Rp {item.productPrice.toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </div>

                              <span className="text-amber-600 font-black text-xs px-1">+</span>

                              <div className="flex items-center gap-1.5">
                                <img
                                  src={item.secondaryProductImageUrl || "/produk/produk2.jpg"}
                                  alt={item.secondaryProductName}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 bg-white"
                                />
                                <div className="max-w-[110px]">
                                  <p className="text-[11px] font-extrabold text-[#131B2E] truncate leading-tight">
                                    {item.secondaryProductName}
                                  </p>
                                  <p className="text-[10px] font-bold text-amber-700">
                                    Rp {(item.secondaryProductPrice || 20000).toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* PRODUK TUNGGAL */
                            <div className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-50 border border-slate-200 max-w-[210px]">
                              <img
                                src={item.productImageUrl}
                                alt={item.productName}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 bg-white"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold truncate text-[#131B2E]">
                                  {item.productName}
                                </p>
                                <p className="text-[10px] font-extrabold text-amber-700">
                                  Rp {item.productPrice.toLocaleString("id-ID")}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, isSelected ? "planned" : "generated")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                                  isSelected
                                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-[#004AC6] hover:bg-blue-700 text-white"
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Dipakai</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Pakai Ide</span>
                                  </>
                                )}
                              </button>
                            )}

                            <Link
                              href={studioUrl}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#E2E8F0] hover:border-blue-300 text-[#004AC6] hover:bg-blue-50 shadow-xs transition-all flex items-center gap-1"
                              title="Buka Studio Poster"
                            >
                              <span>Studio</span>
                              <Sparkles className="w-3 h-3 text-amber-400" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleRegenerateIdea(item)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-600 border border-slate-200"
                              title="Ganti Ide Lain (Variasi Alternatif)"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setEditTopic(item.topic);
                                setEditDesc(item.description);
                              }}
                              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                              title="Edit Topik Manual"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {/* ========================================================
                  KONDISI 2: TAMPILAN KARTU GRID
                 ======================================================== */}
              {viewMode === "card" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {items.map((item) => {
                    const isSelected = item.status === "generated" || item.status === "published";
                    const isCompleted = item.status === "published";
                    const studioUrl = `/studio?planId=${encodeURIComponent(item.id)}&productId=${encodeURIComponent(item.recommendedProductId)}&goal=${encodeURIComponent(selectedGoal)}&topic=${encodeURIComponent(item.topic)}`;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between border ${
                          isCompleted
                            ? "bg-slate-50 border-slate-200 opacity-80"
                            : isSelected
                            ? "bg-white border-blue-400 shadow-md ring-2 ring-blue-500/10"
                            : "bg-white text-[#131B2E] border-[#E2E8F0] shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black uppercase tracking-wide text-[#131B2E]">
                              OPSI {item.dayNumber}
                            </span>
                            {item.matchScore && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Cocok {item.matchScore}%
                              </span>
                            )}
                          </div>

                          <div className="mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#004AC6] border border-blue-100">
                              {item.badge}
                            </span>
                          </div>

                          <h3 className={`font-black text-base leading-snug mb-1.5 ${
                            isCompleted ? "line-through text-slate-400" : "text-[#131B2E]"
                          }`}>
                            {item.topic}
                          </h3>

                          <p className={`text-xs leading-relaxed mb-4 ${
                            isCompleted ? "text-slate-400" : "text-[#434655]"
                          }`}>
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-3">
                          {item.isBundle && item.secondaryProductName ? (
                            /* TAMPILAN KHUSUS PAKET COMBO PADA KARTU: DUA PRODUK JELAS */
                            <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-amber-50/70 border border-amber-200">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1.5 border-r border-amber-200/80">
                                <img
                                  src={item.productImageUrl}
                                  alt={item.productName}
                                  className="w-7 h-7 rounded-lg object-cover shrink-0 bg-white"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-extrabold text-[#131B2E] truncate">
                                    {item.productName}
                                  </p>
                                  <p className="text-[9px] font-bold text-amber-700">
                                    Rp {item.productPrice.toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </div>

                              <span className="text-amber-600 font-black text-xs px-0.5">+</span>

                              <div className="flex items-center gap-1.5 flex-1 min-w-0 pl-0.5">
                                <img
                                  src={item.secondaryProductImageUrl || "/produk/produk2.jpg"}
                                  alt={item.secondaryProductName}
                                  className="w-7 h-7 rounded-lg object-cover shrink-0 bg-white"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-extrabold text-[#131B2E] truncate">
                                    {item.secondaryProductName}
                                  </p>
                                  <p className="text-[9px] font-bold text-amber-700">
                                    Rp {(item.secondaryProductPrice || 20000).toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 p-2 rounded-2xl border bg-slate-50 border-slate-200 text-[#131B2E]">
                              <img
                                src={item.productImageUrl}
                                alt={item.productName}
                                className="w-10 h-10 rounded-xl object-cover shrink-0 bg-white"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate">
                                  {item.productName}
                                </p>
                                <p className="text-[11px] font-extrabold text-amber-700">
                                  Rp {item.productPrice.toLocaleString("id-ID")}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.id, isCompleted ? "planned" : isSelected ? "published" : "generated")}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 ${
                                isCompleted
                                  ? "bg-slate-100 text-slate-500 border-slate-200"
                                  : isSelected
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "bg-[#004AC6] text-white hover:bg-blue-700"
                              }`}
                            >
                              {isCompleted ? "Selesai Diposting" : isSelected ? "✓ Terpilih" : "+ Pakai Ide"}
                            </button>

                            <div className="flex items-center gap-1">
                              <Link
                                href={studioUrl}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#E2E8F0] text-[#004AC6] hover:bg-blue-50 shadow-xs flex items-center gap-1"
                              >
                                <span>Studio</span>
                                <Sparkles className="w-3 h-3 text-amber-400" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleRegenerateIdea(item)}
                                className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600"
                                title="Ganti Ide Lain"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>

                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setEditTopic(item.topic);
                                  setEditDesc(item.description);
                                }}
                                className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600"
                                title="Edit Topik"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </main>
        )}

      {/* MODAL RESET / GANTI STRATEGI */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#131B2E]">Ganti Target Strategi?</h3>
                <p className="text-xs text-[#434655] mt-0.5">Strategi aktif saat ini akan tetap tersimpan dan kamu bisa meracik target baru.</p>
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
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-[#004AC6] hover:bg-blue-700 shadow-sm transition-all"
              >
                Ya, Racik Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT TOPIK & DESKRIPSI MANUAL */}
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#EAF4FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-[#004AC6] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-600">Memuat Strategi Pemasaran...</p>
        </div>
      </div>
    }>
      <MarketingHubContent />
    </Suspense>
  );
}

