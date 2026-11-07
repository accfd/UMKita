import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UMKita — Asisten Branding Visual UMKM",
  description: "Platform pendamping pemasaran digital, kreasi poster promosi berbasis Computer Vision dan AI, serta kalender konten otomatis bagi UMKM kuliner Sumatera Barat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.className} antialiased min-h-screen text-slate-800 bg-slate-50`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
