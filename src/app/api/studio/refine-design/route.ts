import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userPrompt, currentData } = body;

    if (!userPrompt) {
      return NextResponse.json(
        { success: false, error: "userPrompt (instruksi revisi) wajib diisi." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // Fallback jika API key belum ada
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        source: "fallback",
        revisedHeadline: `${currentData?.currentHeadline || currentData?.productName || "Spesial"} (Revisi)`,
        revisedCaption: `${currentData?.currentCaption || ""}\n\n[Catatan Revisi]: ${userPrompt}`,
        revisedPreset: "bold_punch_promo",
        revisedPrimaryColor: "#DC2626",
        revisedSecondaryColor: "#F59E0B",
        aiExplanation: `Saya telah menyesuaikan desain dan caption berdasarkan permintaan: "${userPrompt}"`,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const systemPrompt = `
Anda adalah AI Creative Director & Designer Copilot untuk aplikasi visual UMKM 'UMKita'.
Pengguna ingin MEREVISI desain poster dan caption yang sudah ada melalui instruksi bahasa alami (prompting).

Data Saat Ini:
- Nama Produk: ${currentData?.productName || "Produk Kuliner"}
- Harga: ${currentData?.price || "Rp 25.000"}
- Headline Saat Ini: ${currentData?.currentHeadline || ""}
- Caption Saat Ini: ${currentData?.currentCaption || ""}
- Preset Gaya Saat Ini: ${currentData?.currentPreset || "claymorphism"} (Pilihan: rustic_minang, claymorphism, editorial_magazine, clean_minimalist, bold_punch_promo, nostalgia_vintage)
- Warna Primer: ${currentData?.currentPrimaryColor || "#2563EB"}
- Warna Sekunder: ${currentData?.currentSecondaryColor || "#F59E0B"}

INSTRUKSI REVISI DARI PENGGUNA:
"${userPrompt}"

TUGAS ANDA:
1. Terjemahkan instruksi pengguna ke dalam parameter visual baru dan teks caption/headline yang diperbarui.
2. Jika pengguna meminta perubahan gaya/suasana warna (misal: "lebih pedas", "nuansa kayu tradisional", "mewah minimalis"), sesuaikan 'presetStyle' dan kode HEX 'primaryColor' serta 'secondaryColor'.
3. Perbarui teks 'revisedHeadline' (maksimal 6-8 kata, persuasif).
4. Perbarui teks 'revisedCaption' secara lengkap sesuai instruksi (misal jika diminta pantun Minang, bahasa lebih santai, atau fokus diskon).
5. Berikan 'aiExplanation' ramah dalam 1-2 kalimat bahasa Indonesia menjelaskan perubahan yang Anda buat.

KEMBALIKAN DALAM FORMAT JSON PERSIS SEPERTI INI:
{
  "revisedHeadline": "string",
  "revisedCaption": "string",
  "revisedPreset": "rustic_minang | claymorphism | editorial_magazine | clean_minimalist | bold_punch_promo | nostalgia_vintage",
  "revisedPrimaryColor": "#HEX",
  "revisedSecondaryColor": "#HEX",
  "aiExplanation": "string"
}
`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      source: "gemini",
      ...parsed,
    });
  } catch (error: any) {
    console.error("[API refine-design error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memproses revisi prompt desain.",
      },
      { status: 500 }
    );
  }
}

