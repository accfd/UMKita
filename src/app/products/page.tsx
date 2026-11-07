"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Sparkles,
  Edit3,
  CheckCircle2,
  XCircle,
  Tag,
  Star,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  ShoppingBag,
  TrendingUp,
  Boxes
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { SANJAI_NAFAMA_PRODUCTS } from "@/lib/constants";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  description: string;
  advantages: string;
  originalImageUrl: string;
  badge?: string;
  isActive: boolean;
}

const GALLERY_PRESETS = [
  { url: "/produk/produk1.jpeg", label: "Keripik Sanjai Balado" },
  { url: "/produk/produk2.jpg", label: "Keripik Sanjai Tawar / Kuning" },
  { url: "/produk/produk3.jpg", label: "Karak Kaliang / Angka 8" },
  { url: "/produk/produk4.jpg", label: "Keripik Balado Panjang (Stik)" },
  { url: "/produk/produk5.jpg", label: "Sanjai Nafama Kemasan Oleh-oleh" }
];

export default function ProductsPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAdvantages, setFormAdvantages] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("/produk/produk1.jpeg");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Produk dari Database Neon
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success && json.data) {
        setProducts(json.data);
      } else {
        setProducts(SANJAI_NAFAMA_PRODUCTS as any);
      }
    } catch (err) {
      console.warn("Gagal fetch produk:", err);
      setProducts(SANJAI_NAFAMA_PRODUCTS as any);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 2. Handler Buka Modal Tambah / Edit
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormPrice("");
    setFormDesc("Olahan keripik singkong tradisional khas Nagari Padang Ganting, Tanah Datar.");
    setFormAdvantages("Bahan alami tanpa pewarna buatan, renyah gurih tahan 2 bulan.");
    setFormImageUrl("/produk/produk1.jpeg");
    setShowModal(true);
  };

  const handleOpenEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormPrice(prod.price.toString());
    setFormDesc(prod.description);
    setFormAdvantages(prod.advantages);
    setFormImageUrl(prod.originalImageUrl || "/produk/produk1.jpeg");
    setShowModal(true);
  };

  // 3. Handler Submit Simpan (POST / PUT)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) return;

    try {
      setIsSubmitting(true);
      const numericPrice = Number(formPrice.replace(/[^0-9]/g, "")) || 25000;

      if (editingProduct) {
        // Update (PUT)
        await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            name: formName.trim(),
            price: numericPrice,
            description: formDesc.trim(),
            advantages: formAdvantages.trim(),
            originalImageUrl: formImageUrl
          })
        });
      } else {
        // Create Baru (POST)
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            price: numericPrice,
            description: formDesc.trim(),
            advantages: formAdvantages.trim(),
            originalImageUrl: formImageUrl
          })
        });
      }

      await loadProducts();
      setShowModal(false);
    } catch (err) {
      console.error("Gagal simpan produk:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handler Toggle Ketersediaan Stok (PATCH)
  const handleToggleStatus = async (prod: ProductItem) => {
    const nextStatus = !prod.isActive;
    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, isActive: nextStatus } : p))
    );

    try {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prod.id, isActive: nextStatus })
      });
    } catch (err) {
      console.error("Gagal toggle status produk:", err);
    }
  };

  // Filter & Search
  const filteredProducts = products.filter((p) => {
    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.advantages.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterActiveOnly) return matchQuery && p.isActive;
    return matchQuery;
  });

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const avgPrice =
    totalProducts > 0
      ? Math.round(products.reduce((acc, curr) => acc + curr.price, 0) / totalProducts)
      : 0;

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#131B2E]">
      
      {/* 1. ASIDE SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* 2. MAIN APP SHELL */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        
        {/* TOP HEADER */}
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} showModeAi={true} />

        {/* MAIN CONTENT */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 pt-8 pb-24">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* HEADER TITLE & ACTION BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#004AC6] text-[11px] font-bold shadow-xs mb-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>Katalog Database Neon • Sanjai Nafama</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#131B2E]">
                  Katalog Produk Toko
                </h1>
                <p className="text-xs sm:text-sm text-[#434655] font-medium max-w-xl mt-0.5">
                  Kelola daftar oleh-oleh khas Sanjai Nafama yang tersimpan di sistem. Seluruh produk aktif otomatis digunakan dalam strategi rekomendasi pemasaran.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 rounded-full bg-[#004AC6] hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Produk Baru</span>
              </button>
            </div>

            {/* METRIC OVERVIEW CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <Boxes className="w-5 h-5 text-[#004AC6]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Terdaftar</p>
                  <p className="text-xl sm:text-2xl font-black text-[#131B2E]">{totalProducts} Varian</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Stok Siap Jual</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-700">{activeProducts} Aktif</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Rata-rata Harga</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-700">Rp {avgPrice.toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari varian keripik, keunggulan, atau rasa..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-[#131B2E] outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setFilterActiveOnly(!filterActiveOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                  filterActiveOnly
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{filterActiveOnly ? "Hanya Stok Aktif (✓)" : "Semua Status"}</span>
              </button>
            </div>

            {/* PRODUCT CARDS GRID */}
            {isLoading ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E8F0]">
                <div className="w-8 h-8 border-4 border-[#004AC6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-600">Memuat katalog dari database Neon...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E8F0] space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Tidak ada produk yang cocok</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Coba kata kunci pencarian lain atau klik tombol tambah produk di atas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className={`rounded-3xl p-4 transition-all flex flex-col justify-between border bg-white ${
                      prod.isActive
                        ? "border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-blue-300"
                        : "border-slate-200 opacity-65 bg-slate-50/50"
                    }`}
                  >
                    <div>
                      {/* Thumbnail & Badges */}
                      <div className="relative mb-3 overflow-hidden rounded-2xl bg-slate-100 h-44">
                        <img
                          src={prod.originalImageUrl || "/produk/produk1.jpeg"}
                          alt={prod.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          {prod.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#004AC6] text-white shadow-xs">
                              {prod.badge}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs ${
                              prod.isActive
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-600 text-white"
                            }`}
                          >
                            {prod.isActive ? "Tersedia" : "Nonaktif"}
                          </span>
                        </div>
                      </div>

                      {/* Info: Name & Price */}
                      <div className="space-y-1 mb-2">
                        <h3 className="font-black text-sm text-[#131B2E] leading-snug">
                          {prod.name}
                        </h3>
                        <p className="text-base font-black text-amber-700">
                          Rp {prod.price.toLocaleString("id-ID")}
                        </p>
                      </div>

                      {/* Advantages Tag */}
                      {prod.advantages && (
                        <div className="mb-2">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-[#004AC6] text-[10px] font-bold leading-relaxed border border-blue-100">
                            ✨ {prod.advantages}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-xs text-[#434655] leading-relaxed mb-4">
                        {prod.description}
                      </p>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {/* Promosikan Button */}
                      <Link
                        href={`/marketing?productId=${encodeURIComponent(prod.id)}`}
                        className="w-full py-2 px-3 rounded-xl bg-[#004AC6] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Racik Promosi Produk</span>
                      </Link>

                      {/* Edit & Status Switch */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            prod.isActive
                              ? "text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-200 hover:bg-rose-50"
                              : "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                          }`}
                        >
                          {prod.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(prod)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        </main>

      </div>

      {/* MODAL TAMBAH / EDIT PRODUK */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#004AC6]">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-[#131B2E]">
                  {editingProduct ? "Edit Varian Produk" : "Tambah Produk Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Keripik Sanjai Balado Merah"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-[#131B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual (Rp)</label>
                <input
                  type="number"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="Contoh: 25000"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-[#131B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilihan Foto Produk</label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {GALLERY_PRESETS.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFormImageUrl(p.url)}
                      className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all h-16 ${
                        formImageUrl === p.url ? "border-[#004AC6] ring-2 ring-blue-200" : "border-slate-200 opacity-60 hover:opacity-100"
                      }`}
                      title={p.label}
                    >
                      <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Atau masukkan URL gambar..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none text-slate-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keunggulan Unik (Advantages)</label>
                <input
                  type="text"
                  value={formAdvantages}
                  onChange={(e) => setFormAdvantages(e.target.value)}
                  placeholder="Contoh: Cabai merah asli segar, renyah tanpa pengawet"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 outline-none text-[#131B2E] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Bahan & Olahan</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Jelaskan proses pembuatan khas Padang Ganting..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 outline-none text-[#434655] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-full text-xs font-bold text-white bg-[#004AC6] hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Menyimpan ke DB..." : "Simpan Produk"}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

