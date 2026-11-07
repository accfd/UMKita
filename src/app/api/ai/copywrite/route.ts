import { NextRequest, NextResponse } from "next/server";
import { generateProductCaptions } from "@/lib/gemini";

/**
 * Endpoint: POST /api/ai/copywrite
 * Spesifikasi Sesuai api-contract.md (Modul 4.1 - FERDI)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productName, advantages, goalType, style } = body;

    if (!productName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Nama produk (productName) wajib diisi.",
          },
        },
        { status: 400 }
      );
    }

    const result = await generateProductCaptions({
      productName,
      advantages: advantages || "Kelezatan rasa autentik Minangkabau pilihan terbaik",
      goalType: goalType || "promo_diskon",
      toneOfVoice: style === "hard-sell" ? "persuasif" : "ramah_santai",
      location: "Bukittinggi, Sumatera Barat",
    });

    const selectedOption =
      style === "hard-sell"
        ? result.captions.find((c) => c.id.includes("direct_promo")) || result.captions[1]
        : result.captions.find((c) => c.id.includes("storytelling")) || result.captions[0];

    return NextResponse.json({
      success: true,
      data: {
        hook: selectedOption.hook || "Sensasi pedas manis khas Minangkabau yang bikin ketagihan! 🌶️✨",
        caption: selectedOption.text,
        callToAction: selectedOption.callToAction || "Pesan sekarang via link bio untuk promo terbatas hemat 20%!",
        hashtags: selectedOption.hashtags || ["#KulinerMinang", "#OlehOlehPadang", "#UMKita"],
        isFallback: result.source === "fallback",
      },
    });
  } catch (error: any) {
    console.error("[API /api/ai/copywrite Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Gagal menghasilkan naskah promosi AI.",
        },
      },
      { status: 500 }
    );
  }
}

