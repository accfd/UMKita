"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Package,
  Wand2,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Star,
  MapPin,
  TrendingUp,
  Instagram,
  ExternalLink,
  Plus,
  Compass,
  Tag,
  Rocket,
  BookOpen,
  Menu
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { SANJAI_NAFAMA_BUSINESS, SANJAI_NAFAMA_PRODUCTS, SanjaiProduct } from "@/lib/constants";

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [products, setProducts] = useState<SanjaiProduct[]>(SANJAI_NAFAMA_PRODUCTS);
  const [activeStrategy, setActiveStrategy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);

        // 1. Ambil data katalog produk
        try {
          const prodRes = await fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" });
          const prodJson = await prodRes.json();
          if (prodJson.success && prodJson.data?.length > 0) {
            setProducts(prodJson.data);
          }
        } catch (e) {
          console.warn("Notice fetch products on home:", e);
        }

        // 2. Ambil data strategi pemasaran aktif
        try {
          const planRes = await fetch("/api/marketing/planner");
          const planJson = await planRes.json();
          if (planJson.success && planJson.data?.items?.length > 0) {
            setActiveStrategy(planJson.data);
          }
        } catch (e) {
          console.warn("Notice fetch planner on home:", e);
        }

      } catch (err) {
        console.error("Gagal memuat dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive !== false).length;
  const executedIdeasCount = activeStrategy?.items?.filter(
    (it: any) => it.status === "generated" || it.status === "published"
  )?.length || 0;
  const totalIdeasCount = activeStrategy?.items?.length || 0;

  const targetLabelMap: Record<string, string> = {
    promo_diskon: "Promo Diskon Kilat",
    product_launch: "Peluncuran Produk Baru",
    brand_awareness: "Kenalkan Ciri Khas Brand",
    edukasi_pelanggan: "Edukasi & Tips Rasa"
  };

  const primaryProduct = activeStrategy?.items?.[0] || products[0];

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#131B2E]">
      
      {/* 1. ASIDE SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} productCount={totalProducts} />

      {/* 2. MAIN APP SHELL */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        
        {/* Mobile Menu Trigger (Hanya Tampil di Mobile HP) */}
        <div className="lg:hidden p-4 flex items-center justify-between bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <img src="/assets/logo.jpeg" alt="Logo" className="w-7 h-7 rounded-lg object-contain border border-slate-200" />
            <span className="font-extrabold text-sm text-[#1E2A5E]">UMKita</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5 text-[#004AC6]" />
          </button>
        </div>

        {/* MAIN DASHBOARD CANVAS */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-24">
          <div className="max-w-6xl mx-auto space-y-7">
            
            {/* HERO BANNER & WELCOME (Glossy Royal Blue Clay Card with MIMO Mascot) */}
            <div
              className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] text-white p-6 sm:p-9 lg:p-10 border border-white/20 select-none"
              style={{
                boxShadow:
                  "0px 20px 40px -10px rgba(37, 99, 235, 0.4), inset 0px 2px 4px rgba(255, 255, 255, 0.45), inset 0px -2px 4px rgba(0, 0, 0, 0.15)",
              }}
            >
              {/* Claymorphic Background Bokeh Bubbles */}
              <div
                className="absolute -left-16 -top-16 w-56 h-56 rounded-full pointer-events-none opacity-30 z-0"
                style={{
                  background:
                    "radial-gradient(98.99% 98.99% at 30% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(214, 235, 255, 0.25) 70%, rgba(186, 220, 255, 0.15) 100%)",
                  boxShadow:
                    "inset -5px -5px 15px rgba(37, 99, 235, 0.08), inset 8px 8px 15px rgba(255, 255, 255, 0.8)",
                }}
              />

              <div
                className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full pointer-events-none opacity-25 z-0"
                style={{
                  background:
                    "radial-gradient(98.99% 98.99% at 30% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(214, 235, 255, 0.25) 70%, rgba(186, 220, 255, 0.15) 100%)",
                  boxShadow:
                    "inset -5px -5px 15px rgba(37, 99, 235, 0.08), inset 8px 8px 15px rgba(255, 255, 255, 0.8)",
                }}
              />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-10">
                {/* Left Column: Text & Call to Action (Guaranteed No Overlap) */}
                <div className="flex-1 max-w-xl xl:max-w-2xl space-y-3.5">
                  
                  {/* Status Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 text-[11px] font-bold shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Toko Buka • Nagari Padang Ganting, Tanah Datar</span>
                    </span>

                    <a
                      href={SANJAI_NAFAMA_BUSINESS.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold border border-white/25 backdrop-blur-sm transition-colors shadow-xs"
                    >
                      <Instagram className="w-3 h-3 text-pink-300" />
                      <span>{SANJAI_NAFAMA_BUSINESS.handle}</span>
                    </a>
                  </div>

                  {/* Headline */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                    Selamat Datang, Pemilik {SANJAI_NAFAMA_BUSINESS.name} ✨
                  </h1>

                  <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed max-w-lg">
                    Pusat kendali promosi dan katalog camilan otentik Minangkabau. Siapkan strategi promosi terbaik pekan ini untuk memperbanyak pesanan oleh-oleh via WhatsApp.
                  </p>

                  {/* Hero CTA Button (Figma Exact White Clay Pill with Golden Star) */}
                  <div className="pt-2">
                    <Link
                      href="/marketing"
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#004AC6] font-extrabold text-xs sm:text-sm transition-all hover:scale-105 active:scale-98 group"
                      style={{
                        boxShadow:
                          "0px 10px 20px -3px rgba(0, 0, 0, 0.18), inset 0px 2px 4px 1px rgba(255, 255, 255, 0.95), inset 0px -2px 3px 1px rgba(148, 163, 184, 0.25)",
                      }}
                    >
                      <span className="text-amber-500 font-black text-sm">★</span>
                      <span>Racik Strategi Pemasaran</span>
                      <ArrowRight className="w-4 h-4 text-[#004AC6] group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                </div>

                {/* Right Column: MIMO Mascot (Dedicated Area - No Overlap) */}
                <div className="shrink-0 flex items-center justify-center relative md:pr-4">
                  {/* Glowing Ambient Aura Behind Mascot */}
                  <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-blue-300/25 blur-3xl pointer-events-none" />

                  <img
                    src="/assets/MIMO_Gerak.webp"
                    alt="MIMO Maskot Asisten UMKM"
                    className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-60 lg:h-60 object-contain drop-shadow-[0_20px_45px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform duration-300"
                    loading="eager"
                  />
                </div>
              </div>
            </div>

            {/* GRID 3 KARTU METRIK UTAMA TOKO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Metrik 1: Katalog Produk */}
              <Link
                href="/products"
                className="group p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#004AC6] flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {activeProducts} Aktif
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Katalog Toko</p>
                  <p className="text-xl sm:text-2xl font-black text-[#131B2E] mt-0.5">
                    {totalProducts} Varian Produk
                  </p>
                  <p className="text-xs text-[#434655] mt-1 font-medium">
                    Kelola nama, harga resmi, keunggulan bahan, dan stok ketersediaan oleh-oleh.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-[#004AC6] group-hover:translate-x-1 transition-transform">
                  <span>Lihat Katalog Produk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* Metrik 2: Strategi Pemasaran */}
              <Link
                href="/marketing"
                className="group p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#004AC6] border border-blue-200">
                      {activeStrategy ? "Aktif" : "Siap Dirumuskan"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Strategi Pemasaran</p>
                  <p className="text-xl sm:text-2xl font-black text-[#131B2E] mt-0.5 truncate">
                    {activeStrategy ? targetLabelMap[activeStrategy.goalType] || "Promo Aktif" : "Belum Ada Target"}
                  </p>
                  <p className="text-xs text-[#434655] mt-1 font-medium">
                    {activeStrategy
                      ? `${executedIdeasCount} dari ${totalIdeasCount} ide konten telah kamu pilih untuk dipromosikan.`
                      : "Rumuskan target promo mingguanmu dalam 1 menit bersama asisten cerdas."}
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                  <span>Buka Bank Ide Konten</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* Metrik 3: Studio Pembuat Poster */}
              <Link
                href="/studio"
                className="group p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <Wand2 className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Siap Pakai
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Studio Desain Poster</p>
                  <p className="text-xl sm:text-2xl font-black text-[#131B2E] mt-0.5">
                    Studio Kreatif
                  </p>
                  <p className="text-xs text-[#434655] mt-1 font-medium">
                    Hasilkan materi poster siap posting dengan template Instagram Story dan Feed otomatis.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  <span>Buka Studio Poster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>

            </div>

            {/* WIDGET STATUS STRATEGI PEKAN INI */}
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#004AC6] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-[#131B2E]">
                      Status Strategi Pemasaran Pekan Ini
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Pemantauan langsung strategi aktif yang tersimpan di sistem toko
                    </p>
                  </div>
                </div>

                <Link
                  href="/marketing"
                  className="px-4 py-2 rounded-full bg-[#004AC6] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>Buka Halaman Strategi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {activeStrategy ? (
                /* KONDISI A: STRATEGI AKTIF TERSEDIA */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                  
                  {/* Info Target */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#004AC6] border border-blue-200">
                      Target Berjalan
                    </span>
                    <h3 className="text-lg font-black text-[#131B2E]">
                      {targetLabelMap[activeStrategy.goalType] || "Promosi Terarah"}
                    </h3>
                    <p className="text-xs text-[#434655] leading-relaxed">
                      Strategi konten terkurasi berbasis pencocokan katalog produk Sanjai Nafama dan momentum belanja pelanggan.
                    </p>
                  </div>

                  {/* Produk Utama Pilihan */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <img
                      src={primaryProduct.productImageUrl || primaryProduct.originalImageUrl || "/produk/produk1.jpeg"}
                      alt={primaryProduct.productName || primaryProduct.name}
                      className="w-14 h-14 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wide">
                        Produk Unggulan
                      </span>
                      <p className="text-xs font-black text-[#131B2E] truncate">
                        {primaryProduct.productName || primaryProduct.name}
                      </p>
                      <p className="text-xs font-extrabold text-slate-700">
                        Rp {Number(primaryProduct.productPrice || primaryProduct.price || 25000).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Progres Eksekusi Bar */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#131B2E]">
                      <span>Ide Terpilih</span>
                      <span className="text-[#004AC6] font-black">{executedIdeasCount} dari {totalIdeasCount} Opsi</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden p-0.5">
                      <div
                        style={{ width: `${totalIdeasCount > 0 ? (executedIdeasCount / totalIdeasCount) * 100 : 0}%` }}
                        className="h-full bg-[#004AC6] rounded-full transition-all duration-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Kunjungi menu Strategi Pemasaran untuk memilih materi yang ingin kamu posting hari ini.
                    </p>
                  </div>

                </div>
              ) : (
                /* KONDISI B: BELUM ADA STRATEGI AKTIF */
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#004AC6] flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#131B2E]">Belum Ada Strategi Pemasaran Aktif</h3>
                    <p className="text-xs text-[#434655] max-w-md mx-auto mt-1">
                      Pilih produk yang ingin kamu genjot penjualannya pekan ini. Asisten cerdas akan menyusun bank ide konten siap pakai dalam hitungan detik.
                    </p>
                  </div>
                  <Link
                    href="/marketing"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#004AC6] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <span>Mulai Buat Strategi Pekan Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* CUPLIKAN PRODUK UNGGULAN TOKO */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-base text-[#131B2E]">
                    Varian Oleh-Oleh Sanjai Nafama
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Katalog camilan otentik yang siap dipromosikan ke pembeli dan wisatawan
                  </p>
                </div>
                <Link
                  href="/products"
                  className="text-xs font-bold text-[#004AC6] hover:underline flex items-center gap-1"
                >
                  <span>Lihat Semua Produk ({totalProducts})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.slice(0, 4).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative mb-3 h-36 rounded-2xl overflow-hidden bg-slate-100">
                        <img
                          src={prod.originalImageUrl || "/produk/produk1.jpeg"}
                          alt={prod.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      <h3 className="font-black text-sm text-[#131B2E] leading-snug">
                        {prod.name}
                      </h3>
                      <p className="text-sm font-black text-amber-700 mt-0.5">
                        Rp {Number(prod.price).toLocaleString("id-ID")}
                      </p>
                      {prod.advantages && (
                        <p className="text-[10px] font-bold text-[#004AC6] bg-blue-50 border border-blue-100 rounded-lg p-1.5 mt-2 leading-tight">
                          ✨ {prod.advantages}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-3">
                      <Link
                        href={`/marketing?productId=${encodeURIComponent(prod.id)}`}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#004AC6] border border-slate-200 hover:border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Promosikan Produk</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>

      </div>

    </div>
  );
}
