import { NextRequest, NextResponse } from "next/server";
import { composePosterImage, PosterCompositionOptions } from "@/lib/sharp-compositor";
import { generateAiPoster } from "@/lib/ai-image-generator";
import { generatePosterWithComfyUi } from "@/lib/comfyui";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      productImageBase64,
      referenceImageBase64,
      productName,
      price,
      headline,
      brandName,
      presetStyle,
      marketingGoal,
      targetAudience,
      advantages,
      category,
      variationIndex,
      primaryColor,
      secondaryColor,
      showPriceBadge,
      promoBadgeText,
      format,
      showHalalStamp,
      isCutout,
      forceGenerativeAi,
      aiModel, // "gpt-image-2.6-sunburst" | "gpt-image-2.6-flare"
      apiKey,
    } = body;

    if (!productImageBase64) {
      return NextResponse.json(
        { success: false, error: "productImageBase64 wajib disertakan." },
        { status: 400 }
      );
    }

    const wantsGenerativeAi = forceGenerativeAi === true;
    const isGemini = aiModel === "gemini-2.5-flash-image" || !aiModel;
    const rawGemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const cleanGeminiKey = rawGemini ? rawGemini.trim().replace(/^["']|["']$/g, "") : undefined;
    const providerKey = isGemini
      ? cleanGeminiKey
      : (apiKey || process.env.OPENAI_API_KEY);

    // 1. Ekstrak buffer citra produk asli yang diunggah pengguna
    const base64Data = productImageBase64.includes("base64,")
      ? productImageBase64.split("base64,")[1]
      : productImageBase64;

    const imageBuffer = Buffer.from(base64Data, "base64");

    let aiBackdropBuffer: Buffer | undefined;
    let effectiveModelSource = "studio-compositor";
    let effectiveModelName = "Studio Compositor Otentik";

    // 2. Jika model ComfyUI dipilih, jalankan generasi scene latar belakang AI di GPU lokal
    if (aiModel === "comfyui") {
      try {
        // ComfyUI hanya memperhalus panggung kosong. Produk dan label asli
        // sengaja tidak didifusikan agar tidak berubah / terduplikasi.
        const stageBuffer = await composePosterImage({
          productImageBuffer: imageBuffer,
          isCutout: isCutout ?? true,
          productName: productName || "Produk UMKM",
          price: price || "25000",
          headline: headline || "Camilan Pilihan",
          brandName: brandName || "UMKita",
          presetStyle: presetStyle || "tradisional",
          format: format || "feed_4_5",
          skipOverlay: true,
          skipProduct: true,
        });
        const stageBase64 = `data:image/png;base64,${stageBuffer.toString("base64")}`;
        const comfyResult = await generatePosterWithComfyUi({
          productImageBase64: stageBase64,
          productName: productName || "Produk UMKM",
          headline: headline || "Promo Produk Pilihan",
          presetStyle: presetStyle || "tradisional",
          price: price || "25000",
          format: format === "story_9_16" ? "story" : "feed",
        });

        if (comfyResult.success && comfyResult.imageBase64) {
          const bgData = comfyResult.imageBase64.includes("base64,")
            ? comfyResult.imageBase64.split("base64,")[1]
            : comfyResult.imageBase64;
          aiBackdropBuffer = Buffer.from(bgData, "base64");
          effectiveModelSource = "comfyui-local";
          effectiveModelName = "ComfyUI Local Studio (RTX 3050)";
        }
      } catch (err: any) {
        console.error("[ComfyUI Generation Error]:", err.message);
        // ComfyUI bersifat enhancement opsional. Jika server lokal sedang
        // mengembalikan halaman error/XML, lanjutkan dengan compositor agar
        // pengguna tetap memperoleh poster dari foto asli yang valid.
        aiBackdropBuffer = undefined;
        effectiveModelSource = "studio-compositor";
        effectiveModelName = "Studio Composer";
      }
    }

    // 3. Susun Poster Komersial Lengkap:
    // Panggung (AI/Foto Asli) + Produk Asli Bersih + Tipografi Editorial + Harga + Stempel Halal + Badge
    const composeOptions: PosterCompositionOptions = {
      productImageBuffer: imageBuffer,
      backdropBuffer: aiBackdropBuffer,
      isCutout: isCutout ?? true,
      productName: productName || "Produk UMKM",
      price: price || "25000",
      headline: headline || "Promo Produk Pilihan",
      brandName: brandName || "SANJAI NAFAMA",
      presetStyle: presetStyle || "tradisional",
      marketingGoal: marketingGoal || "promo_diskon",
      targetAudience: targetAudience || "wisatawan",
      advantages: advantages,
      category: category,
      variationIndex: typeof variationIndex === "number" ? variationIndex : 0,
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      showPriceBadge: showPriceBadge ?? true,
      promoBadgeText: promoBadgeText || "Hemat 20%",
      format: format || "feed_4_5",
      showHalalStamp: showHalalStamp ?? true,
    };

    const posterBuffer = await composePosterImage(composeOptions);
    const finalBase64 = `data:image/png;base64,${posterBuffer.toString("base64")}`;

    const width = 1080;
    const height = format === "story_9_16" ? 1920 : format === "feed_4_5" ? 1350 : 1080;

    return NextResponse.json({
      success: true,
      source: effectiveModelSource,
      model: effectiveModelName,
      dimensions: {
        width,
        height,
        format: "png",
      },
      finalImageBase64: finalBase64,
    });
  } catch (error: any) {
    console.error("[API compose-poster error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal merender poster promosi.",
      },
      { status: 500 }
    );
  }
}
