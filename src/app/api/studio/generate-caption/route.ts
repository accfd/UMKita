import { NextRequest, NextResponse } from "next/server";
import { generateProductCaptions, CaptionGenerationInput } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { productName, price, advantages, goalType, toneOfVoice, location, category } = body;

    if (!productName) {
      return NextResponse.json(
        { success: false, error: "Nama produk (productName) wajib diisi." },
        { status: 400 }
      );
    }

    const input: CaptionGenerationInput = {
      productName,
      price,
      advantages: advantages || "Kelezatan rasa autentik Minangkabau pilihan terbaik",
      goalType: goalType || "promo_diskon",
      toneOfVoice: toneOfVoice || "ramah_santai",
      location: location || "Sumatera Barat",
      category: category || "kuliner",
    };

    const result = await generateProductCaptions(input);

    return NextResponse.json({
      success: true,
      source: result.source,
      captions: result.captions,
    });
  } catch (error: any) {
    console.error("[API generate-caption error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal menghasilkan caption promosi.",
      },
      { status: 500 }
    );
  }
}

