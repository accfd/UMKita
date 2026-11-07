"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RootWelcomePage() {
  const router = useRouter();
  const [isTapping, setIsTapping] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = () => {
    if (isNavigating) return;

    setIsTapping(true);
    setIsNavigating(true);

    setTimeout(() => {
      setIsTapping(false);
    }, 150);

    // Transisi halus ke /login
    setTimeout(() => {
      router.push("/login");
    }, 350);
  };

  return (
    <main
      onClick={handleClick}
      className={`h-screen w-screen overflow-hidden bg-gradient-to-br from-[#070E28] via-[#0D1B44] to-[#050A1E] relative flex flex-col items-center justify-center cursor-pointer select-none font-sans transition-all duration-500 ${
        isNavigating ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* =====================================================================
          PURE BLUE & CYAN ATMOSPHERIC GLOW (UMKita Signature Blue)
         ===================================================================== */}
      {/* Deep Royal Blue Glow on Top-Left */}
      <div className="absolute -left-24 -top-24 w-[550px] h-[550px] bg-[#1D4ED8]/25 rounded-full blur-[140px] pointer-events-none" />

      {/* Electric Blue / Cyan Ambient Glow on Bottom-Right */}
      <div className="absolute -right-24 -bottom-24 w-[600px] h-[600px] bg-[#004AC6]/30 rounded-full blur-[150px] pointer-events-none" />

      {/* Soft Cyan Ambient Light Center-Left */}
      <div className="absolute left-1/4 bottom-1/3 w-[350px] h-[350px] bg-[#38BDF8]/15 rounded-full blur-[110px] pointer-events-none" />

      {/* Center Mascot Halo (Electric Blue Aura) */}
      <div className="absolute w-[420px] h-[420px] bg-[#2563EB]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* =====================================================================
          CENTER: CONCENTRIC CIRCLE RINGS + MASCOT MIMO (TUNGGAL & JERNIH)
         ===================================================================== */}
      <div className="relative flex flex-col items-center justify-center z-10 group">
        
        {/* Outer Concentric Circle 1 - Blue Tinged */}
        <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-blue-400/10 pointer-events-none animate-pulse" />

        {/* Outer Concentric Circle 2 - Subtle Glow Ring */}
        <div className="absolute w-88 h-88 sm:w-96 sm:h-96 rounded-full border border-cyan-300/5 pointer-events-none" />

        {/* MIMO Mascot - Animasi WebP Murni */}
        <div
          className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center transition-transform duration-200 ease-out ${
            isTapping ? "scale-90" : "group-hover:scale-105"
          }`}
        >
          <img
            src="/assets/MIMO_Gerak.webp"
            alt="MIMO Maskot UMKita"
            className="w-full h-full object-contain drop-shadow-[0_20px_45px_rgba(0,74,198,0.45)]"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* SUBTLE TEXT BELOW ICON */}
        <p className="mt-8 text-xs sm:text-sm text-blue-200/80 font-medium tracking-wide group-hover:text-white transition-colors duration-200">
          Klik maskot untuk melanjutkan.
        </p>

      </div>
    </main>
  );
}
