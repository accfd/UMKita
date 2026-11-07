"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Sparkles,
  Lightbulb,
  Wand2,
  FolderArchive,
  X
} from "lucide-react";
import { SANJAI_NAFAMA_BUSINESS } from "@/lib/constants";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

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
      badge: "4"
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

      {/* Aside Sidebar (Figma Exact: 260px) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-white border-r border-[#E2E8F0] shadow-[0px_14px_28px_-6px_rgba(37,99,235,0.08)] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header & Nav Container */}
        <div className="flex flex-col p-4 gap-6">
          
          {/* Logo Header */}
          <div className="flex items-center justify-between px-2 pt-2">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <img
                src="/assets/logo.jpeg"
                alt="UMKita Logo"
                className="w-9 h-9 rounded-xl object-contain shadow-sm border border-slate-200 group-hover:scale-105 transition-transform bg-white shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-[#131B2E]">
                    UMKita
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-[#004AC6]">
                    PWA
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
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition-all relative ${
                    item.isActive
                      ? "bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-md shadow-blue-500/25"
                      : "text-[#434655] hover:text-[#131B2E] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${item.isActive ? "text-white" : "text-[#737686]"}`} />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.badge === "Baru"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
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

        {/* Bottom Profile Card */}
        <div className="p-4 border-t border-[#E2E8F0]">
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm">
                UR
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-[#131B2E] truncate">
                  {SANJAI_NAFAMA_BUSINESS.name}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 truncate">
                  Kuliner • Minang
                </p>
              </div>
            </div>

            {/* Brand Kit status */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FEA619]" />
                <span className="text-slate-500 font-medium">Brand Kit</span>
              </div>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
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
