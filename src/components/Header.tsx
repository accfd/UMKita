"use client";

import React from "react";
import { Search, Bell, Menu, Sparkles } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  showModeAi?: boolean;
}

export default function Header({ onToggleSidebar, showModeAi = true }: HeaderProps) {
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
        <div className="relative w-48 sm:w-80">
          <Search className="w-4 h-4 text-[#737686] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari produk atau konten..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-xs text-[#131B2E] placeholder:text-[#737686] focus:outline-none focus:border-[#004AC6] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* Right: Mode AI, Notifications & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Mode AI Pill (Figma Exact) */}
        {showModeAi && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 shadow-sm" suppressHydrationWarning>
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

        {/* User Profile Pill (Figma Exact: UR avatar + Asisten Branding UMKM / Owner Sanjai) */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-[#FEA619] text-white flex items-center justify-center font-black text-xs shadow-sm ring-2 ring-amber-100">
            UR
          </div>

          <div className="text-left hidden sm:block">
            <p className="text-xs font-extrabold text-[#131B2E] leading-tight">
              Asisten Branding UMKM
            </p>
            <p className="text-[10px] font-medium text-[#737686]">
              Owner Sanjai
            </p>
          </div>
        </div>

      </div>

    </header>
  );
}


