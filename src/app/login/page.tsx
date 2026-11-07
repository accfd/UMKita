"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { SANJAI_NAFAMA_BUSINESS } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("unirina.sanjai@gmail.com");
  const [password, setPassword] = useState("sanjainafama2026");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  const handleDemoLogin = () => {
    setIsDemoLoading(true);
    setEmail("unirina.sanjai@gmail.com");
    setPassword("sanjainafama2026");
    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full bg-gradient-to-br from-[#EAF4FF] via-[#E2EFFF] to-[#D6EBFF] flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden font-sans select-none">
      
      {/* =====================================================================
          LEFT COLUMN (55%): Glossy Blue Gradient Hero with Mascot & Minang Elements
         ===================================================================== */}
      <section className="relative w-full lg:w-[55%] lg:h-full lg:max-h-screen bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] p-6 sm:p-8 xl:p-10 flex flex-col justify-between overflow-hidden shadow-2xl z-10 text-white shrink-0">
        
        {/* Large Claymorphic Bokeh Bubbles */}
        <div
          className="absolute -left-16 -top-16 w-56 h-56 xl:w-72 xl:h-72 rounded-full pointer-events-none opacity-40 z-0"
          style={{
            background: "radial-gradient(98.99% 98.99% at 30% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(214, 235, 255, 0.25) 70%, rgba(186, 220, 255, 0.15) 100%)",
            boxShadow: "inset -5px -5px 15px rgba(37, 99, 235, 0.08), inset 8px 8px 15px rgba(255, 255, 255, 0.8)",
          }}
        />

        <div
          className="absolute -right-16 -bottom-20 w-72 h-72 xl:w-96 xl:h-96 rounded-full pointer-events-none opacity-35 z-0"
          style={{
            background: "radial-gradient(98.99% 98.99% at 30% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(214, 235, 255, 0.25) 70%, rgba(186, 220, 255, 0.15) 100%)",
            boxShadow: "inset -5px -5px 15px rgba(37, 99, 235, 0.08), inset 8px 8px 15px rgba(255, 255, 255, 0.8)",
          }}
        />

        {/* 1. TOP HEADER LOGO BADGE */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/assets/logo.jpeg"
              alt="UMKita Logo"
              className="w-10 h-10 xl:w-11 xl:h-11 rounded-xl object-contain shadow-md border border-white/40 bg-white group-hover:scale-105 transition-transform shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl xl:text-2xl tracking-tight text-white leading-tight">
                  UMKita
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] font-medium text-blue-200 tracking-wide">
                AI-Powered Marketing Assistant for UMKM
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-blue-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sapaan MIMO</span>
          </Link>
        </div>

        {/* 2. CENTER MASCOT & 3D SCENE */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-3 sm:my-4 text-center min-h-0">
          
          {/* Ambient Glow Behind Mascot */}
          <div className="absolute w-64 h-64 xl:w-80 xl:h-80 rounded-full bg-blue-300/25 blur-3xl pointer-events-none scale-105" />

          {/* Maskot MIMO 3D Display (Scalable & Compact for Viewport Fit) */}
          <div className="relative w-40 h-40 sm:w-52 sm:h-52 xl:w-64 xl:h-64 flex items-center justify-center shrink-0">
            
            {/* Sparkle Particles Aura Around Mascot */}
            <div className="absolute top-1 right-3 text-amber-300 animate-pulse pointer-events-none">
              <Sparkles className="w-6 h-6 fill-amber-300/60" />
            </div>
            <div className="absolute bottom-3 left-2 text-amber-200 animate-bounce pointer-events-none">
              <Sparkles className="w-5 h-5 fill-amber-200/50" />
            </div>

            <img
              src="/assets/MIMO_Gerak.webp"
              alt="Maskot UMKita Toko Cilik 3D"
              className="w-full h-full object-contain drop-shadow-[0_16px_36px_rgba(255,255,255,0.35)] hover:scale-105 transition-transform duration-300"
              loading="eager"
            />
          </div>

          {/* Hero Headline with Typography Signature (Amber Wavy Squiggle) */}
          <div className="mt-2 xl:mt-3 space-y-1.5 max-w-md mx-auto">
            <h1 className="font-extrabold text-xl sm:text-2xl xl:text-3xl leading-snug tracking-tight text-white drop-shadow-sm">
              <span>Branding Visual UMKM,</span>
              <br />
              <span className="relative inline-block mt-0.5">
                <span className="text-white">Jadi Lebih Mudah</span>
                {/* SVG Amber Wavy Squiggle Under "Jadi Mudah" */}
                <svg
                  className="absolute left-0 -bottom-2 w-full h-2.5 xl:h-3 text-[#FBBF24]"
                  viewBox="0 0 200 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 8C25 2 45 12 70 6C95 0 115 11 140 5C165 -1 185 9 197 5"
                    stroke="#FBBF24"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-[11px] sm:text-xs xl:text-sm text-blue-100 font-normal leading-relaxed max-w-sm mx-auto pt-1">
              Bikin poster promosi otentik, susun rencana konten mingguan, dan kelola katalog produk langsung dari HP Anda.
            </p>
          </div>

        </div>

      </section>

      {/* =====================================================================
          RIGHT COLUMN (45%): Ice-Blue Background with Raised White Clay Login Card
         ===================================================================== */}
      <section className="relative w-full lg:w-[45%] lg:h-full lg:max-h-screen bg-gradient-to-b from-[#F2F8FF] to-[#E5F1FF] p-4 sm:p-6 xl:p-8 flex items-center justify-center overflow-y-auto lg:overflow-hidden">
        
        {/* Subtle Background Bokeh Orbs */}
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full pointer-events-none opacity-40 z-0"
          style={{
            background: "radial-gradient(98.99% 98.99% at 30% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(214, 235, 255, 0.25) 70%, rgba(186, 220, 255, 0.15) 100%)",
            boxShadow: "inset -5px -5px 15px rgba(37, 99, 235, 0.08), inset 8px 8px 15px rgba(255, 255, 255, 0.8)",
          }}
        />

        {/* Centered Raised Clay Login Card (Fit to 100vh on Desktop) */}
        <div
          className="relative z-10 w-full max-w-[390px] xl:max-w-[420px] bg-white rounded-[24px] xl:rounded-[28px] border border-white/80 p-5 sm:p-6 xl:p-7 transition-all my-auto"
          style={{
            boxShadow: "0px 20px 35px -5px rgba(148, 163, 184, 0.25), 0px 8px 16px -6px rgba(148, 163, 184, 0.2), inset 2px 2px 5px 1px rgba(255, 255, 255, 0.9), inset -2px -2px 6px 1px rgba(148, 163, 184, 0.15)",
          }}
        >
          {/* 1. TOP CARD HEADER: Logo & Greeting */}
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-white p-1 border border-slate-100 shadow-xs flex items-center justify-center">
              <img
                src="/assets/logo.jpeg"
                alt="UMKita Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <h2 className="text-xl xl:text-2xl font-black text-[#1E2A5E] tracking-tight leading-snug pt-1">
              Selamat Datang Kembali
            </h2>
            <p className="text-[11px] xl:text-xs font-medium text-[#64748B]">
              Masuk untuk kelola toko & promosi
            </p>
          </div>

          {/* 2. LOGIN FORM FIELDS */}
          <form onSubmit={handleSubmit} className="mt-4 xl:mt-5 space-y-3">
            
            {/* Input: Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#334155] block">
                Email
              </label>
              <div
                className="flex items-center gap-2.5 px-3.5 py-2 xl:py-2.5 bg-[#F1F5F9] border border-[#E2E8F0]/80 rounded-[18px] transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100"
                style={{
                  boxShadow: "inset 2px 3px 6px 1px rgba(148, 163, 184, 0.25), inset -2px -2px 5px 1px rgba(255, 255, 255, 0.85)",
                }}
              >
                <Mail className="w-4 h-4 text-[#94A3B8] shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@tokomu.com"
                  className="w-full bg-transparent text-xs xl:text-sm text-[#1E293B] font-medium placeholder:text-[#94A3B8] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Input: Kata Sandi */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#334155]">
                  Kata Sandi
                </label>
                <a
                  href="#"
                  className="text-[11px] font-semibold text-[#2563EB] hover:underline"
                >
                  Lupa Sandi?
                </a>
              </div>

              <div
                className="flex items-center gap-2.5 px-3.5 py-2 xl:py-2.5 bg-[#F1F5F9] border border-[#E2E8F0]/80 rounded-[18px] transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100"
                style={{
                  boxShadow: "inset 2px 3px 6px 1px rgba(148, 163, 184, 0.25), inset -2px -2px 5px 1px rgba(255, 255, 255, 0.85)",
                }}
              >
                <Lock className="w-4 h-4 text-[#94A3B8] shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent text-xs xl:text-sm text-[#1E293B] font-medium placeholder:text-[#94A3B8] focus:outline-none tracking-wide"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-[#94A3B8] hover:text-[#334155] p-0.5 transition-colors"
                  title={showPassword ? "Sembunyikan Sandi" : "Lihat Sandi"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 3. PRIMARY PILL BUTTON: MASUK */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 xl:py-3 px-5 rounded-full font-bold text-xs xl:text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
                style={{
                  background: "linear-gradient(97.65deg, #3B82F6 0%, #1D4ED8 100%)",
                  boxShadow: "0px 8px 16px -2px rgba(37, 99, 235, 0.4), inset 0px 2px 4px rgba(255, 255, 255, 0.4), inset 0px -2px 4px rgba(0, 0, 0, 0.15)",
                }}
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* 4. DIVIDER 'ATAU' */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="w-full border-t border-[#E2E8F0]" />
            <span className="absolute bg-white px-2.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              ATAU
            </span>
          </div>

          {/* 5. OUTLINED PILL BUTTON: MASUK DENGAN GOOGLE */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2 px-3.5 rounded-full bg-white border border-[#E2E8F0]/85 text-[#334155] font-semibold text-xs xl:text-[13px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-xs"
            style={{
              boxShadow: "0px 4px 10px -2px rgba(148, 163, 184, 0.2), inset 0px 2px 3px 1px rgba(255, 255, 255, 0.9), inset 0px -1px 3px 1px rgba(148, 163, 184, 0.15)",
            }}
          >
            {/* Google 4-Color SVG Icon */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          {/* 6. AMBER PILL DEMO BUTTON WITH SPARKLE */}
          <div className="mt-3 flex flex-col items-center">
            <button
              type="button"
              disabled={isDemoLoading}
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-full font-bold text-xs xl:text-sm text-white flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-md"
              style={{
                background: "linear-gradient(96.11deg, #F59E0B 0%, #D97706 100%)",
                boxShadow: "0px 8px 16px -2px rgba(245, 158, 11, 0.38), inset 0px 2px 4px rgba(255, 255, 255, 0.4), inset 0px -2px 4px rgba(0, 0, 0, 0.12)",
              }}
            >
              {isDemoLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Membuka Demo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                  <span>✨ Coba Demo Toko Sanjai</span>
                </>
              )}
            </button>
            <p className="text-[10px] font-medium text-[#94A3B8] mt-1">
              Langsung masuk tanpa perlu mendaftar
            </p>
          </div>

          {/* 7. CARD FOOTER: Link Daftar Usaha Baru */}
          <div className="mt-3.5 pt-2.5 border-t border-[#F1F5F9] text-center">
            <p className="text-[11px] xl:text-xs font-medium text-[#64748B]">
              Belum punya akun?{" "}
              <Link
                href="/onboarding"
                className="font-bold text-[#2563EB] hover:underline"
              >
                Daftar Usaha Baru
              </Link>
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}
