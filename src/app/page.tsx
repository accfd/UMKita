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
      className={`h-screen w-screen overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] relative flex flex-col items-center justify-center cursor-pointer select-none font-sans transition-all duration-500 ${
        isNavigating ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* =====================================================================
          CLAYMORPHIC BOKEH BUBBLES (Persis seperti pada halaman Login)
         ===================================================================== */}
      {/* Top Left Clay Bokeh Bubble */}
      <div
        className="absolute -left-20 -top-20 w-80 h-80 sm:w-96 sm:h-96 rounded-full pointer-events-none opacity-40 z-0"
        style={{
          background:
            "radial-gradient(98.99% 98.99% at 30% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(214, 235, 255, 0.25) 70%, rgba(186, 220, 255, 0.15) 100%)",
          boxShadow:
            "inset -5px -5px 15px rgba(37, 99, 235, 0.08), inset 8px 8px 15px rgba(255, 255, 255, 0.8)",
        }}
      />

      {/* Bottom Right Clay Bokeh Bubble */}
      <div
        className="absolute -right-20 -bottom-24 w-96 h-96 sm:w-[480px] sm:h-[480px] rounded-full pointer-events-none opacity-35 z-0"
        style={{
          background:
            "radial-gradient(98.99% 98.99% at 30% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(214, 235, 255, 0.25) 70%, rgba(186, 220, 255, 0.15) 100%)",
          boxShadow:
            "inset -5px -5px 15px rgba(37, 99, 235, 0.08), inset 8px 8px 15px rgba(255, 255, 255, 0.8)",
        }}
      />

      {/* Center Ambient Glow Behind Mascot */}
      <div className="absolute w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-blue-300/20 blur-3xl pointer-events-none scale-125 z-0" />

      {/* =====================================================================
          CENTER: CONCENTRIC CIRCLE RINGS + MASCOT MIMO
         ===================================================================== */}
      <div className="relative flex flex-col items-center justify-center z-10 group">
        
        {/* Outer Concentric Circle 1 */}
        <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-white/20 pointer-events-none animate-pulse" />

        {/* Outer Concentric Circle 2 */}
        <div className="absolute w-88 h-88 sm:w-96 sm:h-96 rounded-full border border-white/10 pointer-events-none" />

        {/* MIMO Mascot - Animasi WebP Murni */}
        <div
          className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center transition-transform duration-200 ease-out ${
            isTapping ? "scale-90" : "group-hover:scale-105"
          }`}
        >
          <img
            src="/assets/MIMO_Gerak.webp"
            alt="MIMO Maskot UMKita"
            className="w-full h-full object-contain drop-shadow-[0_24px_50px_rgba(255,255,255,0.4)]"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* SUBTLE TEXT BELOW ICON */}
        <p className="mt-8 text-xs sm:text-sm text-blue-100 font-medium tracking-wide group-hover:text-white transition-colors duration-200 drop-shadow-sm">
          Klik maskot untuk melanjutkan.
        </p>

      </div>
    </main>
  );
}
