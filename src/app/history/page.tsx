"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  FolderArchive,
  Sparkles,
  Copy,
  Check,
  Download,
  Share2,
  Trash2,
  ExternalLink,
  MessageCircle,
  Package,
  Clock,
  Eye,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ArrowRight,
  X,
  AlertCircle
} from "lucide-react";
import { SANJAI_NAFAMA_BUSINESS } from "@/lib/constants";

interface HistoryProduct {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  imageUrl: string;
  advantages: string;
}

interface HistoryItem {
  id: string;
  contentPlanId?: string | null;
  source: string;
  title: string;
  topic: string;
  description: string;
  contentType: string;
  contentTypeLabel: string;
  badge: string;
  status: "published" | "draft" | "generated";
  channel: string;
  publishedAt?: string | null;
  createdAt: string;
  orderCount: number;
  inquiryCount: number;
  notes?: string | null;
  posterImageUrl: string;
  caption: string;
  product: HistoryProduct;
}

interface HistorySummary {
  totalAssets: number;
  publishedCount: number;
  draftCount: number;
}

export default function HistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState<HistorySummary>({
    totalAssets: 0,
    publishedCount: 0,
    draftCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "published" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedItemForModal, setSelectedItemForModal] = useState<HistoryItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // 1. Fetch data dari endpoint /api/history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/history");
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data);
        if (json.summary) {
          setSummary(json.summary);
        }
      }
    } catch (err) {
      console.error("Gagal memuat riwayat galeri aset:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 2. Salin Caption ke Clipboard dengan umpan balik visual
  const handleCopyCaption = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2500);
  };

  // 3. Toggle Status Publikasi (Published vs Draft)
  const handleToggleStatus = async (item: HistoryItem) => {
    const nextStatus = item.status === "published" ? "generated" : "published";
    setIsUpdatingStatus(item.id);

    // Optimistic UI Update
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === item.id) {
          return {
            ...it,
            status: nextStatus,
            publishedAt: nextStatus === "published" ? new Date().toISOString() : null,
          };
        }
        return it;
      })
    );

    // Update Summary locally
    setSummary((prev) => ({
      totalAssets: prev.totalAssets,
      publishedCount:
        nextStatus === "published" ? prev.publishedCount + 1 : Math.max(0, prev.publishedCount - 1),
      draftCount:
        nextStatus === "published" ? Math.max(0, prev.draftCount - 1) : prev.draftCount + 1,
    }));

    try {
      const res = await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        // Revert jika gagal
        await fetchHistory();
      }
    } catch (err) {
      console.error("Error toggle status:", err);
      await fetchHistory();
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // 4. Hapus Item dari Galeri Aset
  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        setSummary((prev) => ({
          totalAssets: Math.max(0, prev.totalAssets - 1),
          publishedCount: prev.publishedCount,
          draftCount: Math.max(0, prev.draftCount - 1),
        }));
        setDeleteCandidateId(null);
        if (selectedItemForModal?.id === id) {
          setSelectedItemForModal(null);
        }
      }
    } catch (err) {
      console.error("Gagal menghapus aset:", err);
    }
  };

  // 5. Unduh Gambar Poster
  const handleDownloadImage = (imageUrl: string, title: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `SanjaiNafama-${title.slice(0, 24).replace(/[^a-zA-Z0-9]/g, "-")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 6. Filter & Search items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === "published" && item.status !== "published") return false;
      if (activeTab === "draft" && item.status === "published") return false;

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesTopic = item.topic.toLowerCase().includes(q);
        const matchesProduct = item.product.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        return matchesTitle || matchesTopic || matchesProduct || matchesDesc;
      }
      return true;
    });
  }, [items, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#131B2E] flex flex-col font-sans antialiased">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col lg:pl-[260px] min-w-0 transition-all duration-300">
        {/* HEADER BAR */}
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} showModeAi={true} />

        {/* CONTENT BODY */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
          
          {/* =================================================================
              TOP HERO & TITLE
             ================================================================= */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-[#E2E8F0] shadow-[0px_4px_20px_-4px_rgba(0,74,198,0.05)]">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#004AC6] text-xs font-bold">
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Pusat Arsip Media & Desain</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#131B2E] tracking-tight">
                Riwayat Konten & Galeri Aset
              </h1>
              <p className="text-xs sm:text-sm text-[#434655] font-medium max-w-2xl">
                Koleksi poster promosi siap unggah, ide konten tereksekusi, dan arsip publikasi media sosial resmi <span className="font-bold text-[#131B2E]">Sanjai Nafama</span>.
              </p>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/marketing"
                className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-700 hover:text-[#004AC6] hover:bg-blue-50 transition-all flex items-center gap-2 shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Bank Ide Aktif</span>
              </Link>
              <Link
                href="/studio"
                className="px-5 py-2.5 rounded-2xl bg-[#004AC6] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Poster di Studio</span>
              </Link>
            </div>
          </div>

          {/* =================================================================
              METRIC SUMMARY TILES
             ================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Metric 1: Total Aset */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Aset Konten
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-[#131B2E]">
                    {summary.totalAssets}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kreasi</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Tersimpan di database tokomu
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <FolderArchive className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 2: Sudah Diposting */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Sudah Diposting
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-700">
                    {summary.publishedCount}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">postingan</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  Tayang di Instagram & WhatsApp
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 3: Draf Siap Unggah */}
            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#004AC6] uppercase tracking-wider">
                  Draf Siap Unggah
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-[#004AC6]">
                    {summary.draftCount}
                  </span>
                  <span className="text-xs font-semibold text-blue-500">siap pakai</span>
                </div>
                <p className="text-[11px] text-[#434655] font-medium mt-1">
                  Poster & caption siap dibagikan
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#004AC6] shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* =================================================================
              FILTER TABS & SEARCH BAR
             ================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E2E8F0] shadow-xs">
            
            {/* Tabs Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === "all"
                    ? "bg-[#004AC6] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>Semua Aset</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === "all" ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {summary.totalAssets}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("published")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === "published"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sudah Diposting</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === "published" ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {summary.publishedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("draft")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === "draft"
                    ? "bg-[#004AC6] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Draf Siap Unggah</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === "draft" ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {summary.draftCount}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul, topik, atau produk..."
                className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#131B2E] placeholder:text-slate-400 focus:outline-none focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

          {/* =================================================================
              ASSETS GRID SECTION
             ================================================================= */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-[#004AC6] rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500">
                Memuat galeri aset dan riwayat promosi...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            /* EMPTY STATE */
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xs space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-[#004AC6] flex items-center justify-center mx-auto shadow-sm">
                <FolderArchive className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-[#131B2E]">
                  {searchQuery ? "Tidak Ditemukan Hasil Pencarian" : "Belum Ada Aset di Kategori Ini"}
                </h3>
                <p className="text-xs text-[#434655] font-medium leading-relaxed">
                  {searchQuery
                    ? `Tidak ada konten yang cocok dengan kata kunci "${searchQuery}". Coba gunakan nama produk atau topik promosi lain.`
                    : "Pilih ide promosi dari Bank Ide Strategi Pemasaran untuk mulai mengarsipkan poster dan caption siap pakai tokomu."}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
                  >
                    Reset Pencarian
                  </button>
                ) : (
                  <>
                    <Link
                      href="/marketing"
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#004AC6] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ke Strategi Pemasaran</span>
                    </Link>
                    <Link
                      href="/studio"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-700 hover:text-[#004AC6] transition-all flex items-center justify-center gap-2"
                    >
                      <span>Buka AI Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* GRID OF CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const isPublished = item.status === "published";
                const isCopied = copiedId === item.id;
                const isUpdating = isUpdatingStatus === item.id;
                const studioUrl = `/studio?planId=${encodeURIComponent(item.contentPlanId || item.id)}&productId=${encodeURIComponent(item.product.id)}&topic=${encodeURIComponent(item.topic)}`;
                const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(item.caption)}`;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#E2E8F0] shadow-[0px_4px_16px_-4px_rgba(0,0,0,0.06)] hover:border-blue-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Top Container: Image + Badges */}
                    <div>
                      {/* Image Preview Container */}
                      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-100">
                        <img
                          src={item.posterImageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {/* Top Overlay Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                          {/* Publication Status Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 pointer-events-auto backdrop-blur-sm ${
                              isPublished
                                ? "bg-emerald-600/90 text-white border border-emerald-400"
                                : "bg-[#004AC6]/90 text-white border border-blue-300"
                            }`}
                          >
                            {isPublished ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                                <span>Sudah Diposting</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>Draf Siap Unggah</span>
                              </>
                            )}
                          </span>

                          {/* Content Topic Badge */}
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                            {item.badge}
                          </span>
                        </div>

                        {/* Bottom Overlay Info Pill */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white pointer-events-none">
                          <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span>{new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedItemForModal(item)}
                            className="bg-white/90 hover:bg-white text-[#131B2E] p-1.5 rounded-lg shadow-sm pointer-events-auto transition-transform hover:scale-105"
                            title="Perbesar Tampilan Poster"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Card Body */}
                      <div className="p-5 space-y-4">
                        
                        {/* Title & Topic */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-[#004AC6]">
                              {item.contentTypeLabel}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              • {item.channel}
                            </span>
                          </div>

                          <h3 className="font-extrabold text-sm sm:text-base text-[#131B2E] leading-snug">
                            {item.title}
                          </h3>
                        </div>

                        {/* Product Chip */}
                        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#131B2E] truncate">
                              {item.product.name}
                            </p>
                            <p className="text-[11px] font-extrabold text-[#004AC6]">
                              {item.product.formattedPrice}
                            </p>
                          </div>
                          <Link
                            href={`/products?search=${encodeURIComponent(item.product.name)}`}
                            className="text-slate-400 hover:text-[#004AC6] p-1"
                            title="Lihat di Katalog Produk"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {/* Caption Preview Box with Copy Button */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Caption Siap Salin
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCaption(item.id, item.caption)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                                isCopied
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                  : "text-[#004AC6] hover:bg-blue-50"
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="bg-[#FAF8FF] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#434655] font-normal leading-relaxed max-h-24 overflow-y-auto whitespace-pre-line custom-scrollbar">
                            {item.caption}
                          </div>
                        </div>

                        {/* Performance Metric Bar if Published */}
                        {isPublished && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{item.inquiryCount || 14} Chat Masuk</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                              <Package className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{item.orderCount || 6} Paket Terjual</span>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-5 pt-0 border-t border-slate-100 flex flex-col gap-2 mt-2">
                      
                      {/* Top Row: Primary Action Links */}
                      <div className="flex items-center gap-2 pt-4">
                        {/* Download Poster Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadImage(item.posterImageUrl, item.title)}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          title="Unduh Gambar Poster"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </button>

                        {/* WhatsApp Share Button */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          title="Bagikan ke WhatsApp Status / Chat"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Studio Link */}
                        <Link
                          href={studioUrl}
                          className="py-2 px-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-blue-300 text-[#004AC6] hover:bg-blue-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          title="Buka & Edit di AI Studio"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Studio</span>
                        </Link>
                      </div>

                      {/* Bottom Row: Status Toggle & Delete */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleStatus(item)}
                          className={`text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 ${
                            isPublished
                              ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                          }`}
                        >
                          {isUpdating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isPublished ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                              <span>Kembalikan ke Draf</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tandai Sudah Diposting</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteCandidateId(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Hapus dari Galeri"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* =================================================================
              MODAL: DETAIL PREVIEW POSTER & CAPTION
             ================================================================= */}
          {selectedItemForModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#004AC6]">
                      Detail Aset Promosi
                    </span>
                    <h3 className="font-black text-base text-[#131B2E]">
                      {selectedItemForModal.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedItemForModal(null)}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body: 2 Columns */}
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Full Poster Preview */}
                  <div className="space-y-3">
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                      <img
                        src={selectedItemForModal.posterImageUrl}
                        alt={selectedItemForModal.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadImage(selectedItemForModal.posterImageUrl, selectedItemForModal.title)}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#131B2E] text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Poster Resolusi Penuh</span>
                    </button>
                  </div>

                  {/* Right Column: Information, Product, Caption */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Product Tag */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                        <img
                          src={selectedItemForModal.product.imageUrl}
                          alt={selectedItemForModal.product.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-black text-[#131B2E]">
                            {selectedItemForModal.product.name}
                          </p>
                          <p className="text-xs font-extrabold text-[#004AC6]">
                            {selectedItemForModal.product.formattedPrice}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {selectedItemForModal.product.advantages}
                          </p>
                        </div>
                      </div>

                      {/* Full Caption */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Salinan Caption Lengkap
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCaption(selectedItemForModal.id, selectedItemForModal.caption)}
                            className="text-xs font-bold text-[#004AC6] hover:underline flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedId === selectedItemForModal.id ? "Tersalin!" : "Salin Teks"}</span>
                          </button>
                        </div>

                        <div className="bg-[#FAF8FF] border border-[#E2E8F0] rounded-xl p-3.5 text-xs text-[#333] font-normal leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line custom-scrollbar">
                          {selectedItemForModal.caption}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(selectedItemForModal.caption)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Kirim ke WhatsApp</span>
                      </a>

                      <Link
                        href={`/studio?planId=${encodeURIComponent(selectedItemForModal.contentPlanId || selectedItemForModal.id)}&productId=${encodeURIComponent(selectedItemForModal.product.id)}&topic=${encodeURIComponent(selectedItemForModal.topic)}`}
                        className="flex-1 py-2.5 rounded-xl bg-[#004AC6] hover:bg-blue-700 text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Edit di Studio</span>
                      </Link>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}

          {/* =================================================================
              MODAL: KONFIRMASI HAPUS ASET
             ================================================================= */}
          {deleteCandidateId && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-black text-base text-[#131B2E]">
                    Hapus Aset dari Galeri?
                  </h3>
                  <p className="text-xs text-[#434655] font-medium leading-relaxed">
                    Konten ini akan dihapus dari galeri arsip. Kamu tetap bisa memilihnya kembali di Bank Ide jika diperlukan.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeleteCandidateId(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(deleteCandidateId)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-all shadow-sm"
                  >
                    Hapus Aset
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

