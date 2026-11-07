"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Sparkles,
  Wand2,
  FolderArchive,
  X
} from "lucide-react";
import { SANJAI_NAFAMA_BUSINESS } from "@/lib/constants";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  productCount?: number;
}

export default function Sidebar({ isOpen, onClose, productCount }: SidebarProps) {
  const pathname = usePathname();
  const [dynProductCount, setDynProductCount] = React.useState<number | null>(productCount ?? null);

  React.useEffect(() => {
    if (productCount !== undefined) {
      setDynProductCount(productCount);
    } else {
      fetch("/api/products", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setDynProductCount(json.data.length);
          }
        })
        .catch(() => {});
    }
  }, [productCount, pathname]);

  const navItems = [
    {
      name: "Beranda",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
      badge: null
    },
    {
      name: "Produk",
      href: "/products",
      icon: Package,
      isActive: pathname.startsWith("/products"),
      badge: dynProductCount !== null ? String(dynProductCount) : "5"
    },
    {
      name: "Strategi Pemasaran",
      href: "/marketing",
      icon: Sparkles,
      isActive: pathname.startsWith("/marketing"),
      badge: null
    },
    {
      name: "AI Studio",
      href: "/studio",
      icon: Wand2,
      isActive: pathname.startsWith("/studio"),
      badge: "Baru"
    },
    {
      name: "Galeri Aset",
      href: "/history",
      icon: FolderArchive,
      isActive: pathname.startsWith("/history"),
      badge: null
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Aside Sidebar - Claymorphic Surface (Figma Exact: 260px) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-gradient-to-b from-[#FFFFFF] via-[#FAF8FF] to-[#F1F5F9] border-r border-[#E2E8F0]/80 flex flex-col justify-between transition-transform duration-300 ease-in-out select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          boxShadow:
            "10px 0px 35px -10px rgba(148, 163, 184, 0.28), inset -2px 0px 5px rgba(255, 255, 255, 0.95)",
        }}
      >
        {/* Top Header & Nav Container */}
        <div className="flex flex-col p-4 gap-6">
          
          {/* Logo Header (Claymorphic Brand Card) */}
          <div className="flex items-center justify-between px-2 pt-2">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div
                className="w-10 h-10 rounded-2xl bg-white p-1 border border-slate-200/80 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{
                  boxShadow:
                    "0px 6px 14px -2px rgba(148, 163, 184, 0.25), inset 2px 2px 4px rgba(255, 255, 255, 0.95), inset -1px -1px 3px rgba(148, 163, 184, 0.15)",
                }}
              >
                <img
                  src="/assets/logo.jpeg"
                  alt="UMKita Logo"
                  className="w-full h-full rounded-xl object-contain"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-[#1E2A5E]">
                    UMKita
                  </span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                  ASISTEN BRANDING UMKM
                </p>
              </div>
            </Link>

            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links - Tactile Claymorphism */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-[20px] text-xs font-bold transition-all relative duration-150 ${
                    item.isActive
                      ? "text-white active:scale-98"
                      : "text-[#334155] hover:text-[#004AC6] hover:bg-white hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                  style={
                    item.isActive
                      ? {
                          background:
                            "linear-gradient(97.65deg, #3B82F6 0%, #1D4ED8 100%)",
                          boxShadow:
                            "0px 10px 20px -3px rgba(37, 99, 235, 0.4), inset 0px 2px 4px rgba(255, 255, 255, 0.45), inset 0px -2px 4px rgba(0, 0, 0, 0.18)",
                        }
                      : {
                          // Inactive hover clay effect via CSS class
                        }
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        item.isActive ? "text-white" : "text-[#64748B]"
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full transition-all ${
                        item.badge === "Baru"
                          ? "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 border border-amber-300/60 shadow-[0px_3px_8px_rgba(245,158,11,0.25),inset_1px_1px_2px_rgba(255,255,255,0.9)]"
                          : item.isActive
                          ? "bg-white/25 text-white border border-white/30 backdrop-blur-sm"
                          : "bg-[#F1F5F9] text-slate-700 border border-slate-200/80 shadow-[inset_1px_1px_3px_rgba(148,163,184,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.9)]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Bottom Profile Card (Raised Clay Card) */}
        <div className="p-4 border-t border-[#E2E8F0]/70">
          <div
            className="p-3.5 bg-white border border-white/90 rounded-[24px] flex flex-col gap-2.5 transition-all hover:scale-[1.01]"
            style={{
              boxShadow:
                "0px 14px 28px -4px rgba(148, 163, 184, 0.25), 0px 4px 10px -2px rgba(148, 163, 184, 0.15), inset 2px 2px 5px 1px rgba(255, 255, 255, 0.95), inset -2px -2px 5px 1px rgba(148, 163, 184, 0.12)",
            }}
          >
            <div className="flex items-center gap-3">
              {/* Clay Avatar Pill */}
              <div
                className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-extrabold text-xs shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #FEA619 0%, #D97706 100%)",
                  boxShadow:
                    "0px 6px 14px -2px rgba(245, 158, 11, 0.4), inset 1px 1px 3px rgba(255, 255, 255, 0.5), inset -1px -1px 3px rgba(0, 0, 0, 0.2)",
                }}
              >
                UR
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-[#1E2A5E] truncate">
                  {SANJAI_NAFAMA_BUSINESS.name}
                </p>
                <p className="text-[10px] font-semibold text-[#64748B] truncate">
                  Kuliner • Minang
                </p>
              </div>
            </div>

            {/* Brand Kit Status Pill (Clay Inset Row) */}
            <div
              className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60 text-[10px] font-bold"
              style={{
                boxShadow:
                  "inset 1px 1px 3px rgba(148, 163, 184, 0.15), inset -1px -1px 2px rgba(255, 255, 255, 0.8)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shadow-xs" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FEA619] shadow-xs" />
                <span className="text-slate-500 font-medium ml-0.5">Brand Kit</span>
              </div>
              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Aktif
              </span>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}

export { default as AppLayout } from "./AppLayout";

