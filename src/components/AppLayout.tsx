"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  productCount?: number;
}

/**
 * AppLayout - Unified layout container for all internal application screens.
 * Ensures 100% visual consistency for the sidebar, mobile drawer, and main canvas.
 */
export default function AppLayout({ children, productCount }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#131B2E]">
      {/* 1. ASIDE SIDEBAR (Single Unified Component) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        productCount={productCount}
      />

      {/* 2. MAIN APP SHELL */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        {/* Mobile Header Bar (Only visible on mobile screens) */}
        <div className="lg:hidden p-4 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <img
              src="/assets/logo.jpeg"
              alt="Logo"
              className="w-7 h-7 rounded-lg object-contain border border-slate-200"
            />
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

        {/* PAGE CONTENT */}
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}

