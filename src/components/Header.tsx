"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, Sparkles, X, Wand2, Package } from "lucide-react";
import { getLocalProducts, subscribeToProducts } from "@/lib/client-products";
import { SanjaiProduct } from "@/lib/constants";

interface HeaderProps {
  onToggleSidebar?: () => void;
  showModeAi?: boolean;
}

export default function Header({ onToggleSidebar, showModeAi = true }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<SanjaiProduct[]>(() => getLocalProducts());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setProducts(d.data);
      })
      .catch(() => {});

    const unsub = subscribeToProducts((prods) => {
      setProducts(prods);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.advantages && p.advantages.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E2E8F0] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu Button & Search Bar */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="Buka Menu"
            suppressHydrationWarning
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search Input (Pill) */}
        <div className="relative w-48 sm:w-80" ref={dropdownRef}>
          <Search className="w-4 h-4 text-[#737686] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Cari produk atau konten..."
            className="w-full pl-10 pr-8 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-xs text-[#131B2E] placeholder:text-[#737686] focus:outline-none focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            suppressHydrationWarning
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Floating Dropdown Results */}
          {isOpen && searchQuery.trim() && (
            <div className="absolute top-11 left-0 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Hasil Pencarian ({filteredProducts.length})
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Klik untuk aksi</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <div key={p.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.originalImageUrl || "/produk/produk1.jpeg"}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[11px] font-extrabold text-[#004AC6]">
                            Rp {Number(p.price).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 pl-13">
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            router.push(`/studio?productId=${encodeURIComponent(p.id)}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#004AC6] text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>Buat Poster</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            router.push(`/marketing?productId=${encodeURIComponent(p.id)}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Promosikan</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            router.push(`/products`);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Package className="w-3 h-3" />
                          <span>Katalog</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Tidak ditemukan produk untuk &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Mode AI, Notifications & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mode AI Pill (Figma Exact) */}
        {showModeAi && (
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 shadow-sm"
            suppressHydrationWarning
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MODE AI: AKTIF</span>
          </div>
        )}

        {/* Bell Notification Button */}
        <button
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          title="Notifikasi"
          suppressHydrationWarning
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#CF2C30] ring-2 ring-white" />
        </button>

        {/* User Profile Thumbnail */}
        <div className="flex items-center gap-2.5 pl-1 sm:pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#004AC6] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            UR
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#131B2E] leading-tight">Asisten Branding UMKM</p>
            <p className="text-[10px] text-[#737686] font-medium">Pemilik Usaha</p>
          </div>
        </div>
      </div>
    </header>
  );
}
