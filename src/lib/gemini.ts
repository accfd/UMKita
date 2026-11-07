import { GoogleGenerativeAI } from "@google/generative-ai";

export interface CaptionGenerationInput {
  productName: string;
  price?: number | string;
  advantages: string;
  category?: string;
  goalType?: string; // "promo_diskon" | "product_launch" | "brand_awareness" | "edukasi_pelanggan"
  toneOfVoice?: string; // "ramah_santai" | "persuasif" | "elegan" | "tradisional"
  location?: string;
}

export interface GeneratedCaptionOption {
  id: string;
  styleLabel: string;
  hook: string;
  text: string;
  callToAction: string;
  hashtags: string[];
}

export interface CaptionGenerationResult {
  success: boolean;
  source: "gemini" | "fallback";
  captions: GeneratedCaptionOption[];
}

/**
 * Format harga ke format Rupiah standar
 */
function formatRupiah(value?: number | string): string {
  if (!value) return "";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9]/g, "")) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Fallback Rule-Based Slot-Filling Engine
 * Menghasilkan variasi caption berkualitas tinggi khas kuliner Minang
 * jika koneksi offline, kuota habis, atau API key belum disetel.
 */
export function generateFallbackCaptions(input: CaptionGenerationInput): GeneratedCaptionOption[] {
  const formattedPrice = input.price ? formatRupiah(input.price) : "";
  const location = input.location || "Sumatera Barat";
  const advantagesList = input.advantages
    ? input.advantages.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
    : ["Rasa autentik", "Bumbu rempah pilihan", "Higienis & halal"];

  const bulletAdvantages = advantagesList.map((adv) => `✅ ${adv}`).join("\n");

  // Opsi 1: Pendekatan Storytelling & Menggugah Selera (Nuansa Minang Hangat)
  const optionA: GeneratedCaptionOption = {
    id: "option_a_storytelling",
    styleLabel: "Storytelling Hangat (Menggugah Selera)",
    hook: "Sore-sore gini paling nikmat ngemil yang gurih nendang! 🌶️✨",
    callToAction: "Yuk pesan sekarang sebelum kehabisan! Klik link di bio atau langsung DM yaa 📲📦",
    hashtags: ["#KulinerMinang", "#OlehOlehPadang", "#CamilanTradisional", "#UMKMJuara", "#RasaAutentik"],
    text: `Sore-sore gini paling nikmat ngemil yang gurih nendang! 🌶️✨

Kenalin nih, ${input.productName} asli dari ${location}. Diracik dengan bumbu rempah warisan tradisi Minangkabau yang autentik. Sekali coba, dijamin bikin nagih dan susah berhenti ngunyah!

Kenapa wajib coba ${input.productName}?
${bulletAdvantages}
${formattedPrice ? `\n💰 Cuma ${formattedPrice} per porsi/bungkus!` : ""}

Yuk pesan sekarang sebelum kehabisan! Klik link di bio atau langsung DM yaa 📲📦

#KulinerMinang #OlehOlehPadang #CamilanTradisional #UMKMJuara #RasaAutentik`,
  };

  // Opsi 2: Pendekatan Hard-Selling / Promo To The Point
  const optionB: GeneratedCaptionOption = {
    id: "option_b_direct_promo",
    styleLabel: "Promo To The Point (Hard-Selling)",
    hook: `🔥 PROMO SPESIAL HARI INI: ${input.productName.toUpperCase()}! 🔥`,
    callToAction: "Stok terbatas setiap harinya! Amankan pesananmu via WhatsApp sekarang 📲👇",
    hashtags: ["#PromoKuliner", "#DiskonUMKM", "#JajananEnak", "#OlehOlehSumbar", "#FastOrder"],
    text: `🔥 PROMO SPESIAL HARI INI: ${input.productName.toUpperCase()}! 🔥

Lagi cari camilan enak, higienis, dan terjangkau? Ini solusinya!
${formattedPrice ? `\n🏷️ Harga Promo Spesial: ${formattedPrice}` : ""}

Keunggulan Produk Kami:
${bulletAdvantages}

Stok terbatas setiap harinya! Amankan pesananmu via WhatsApp sekarang 📲👇

#PromoKuliner #DiskonUMKM #JajananEnak #OlehOlehSumbar #FastOrder`,
  };

  return [optionA, optionB];
}

/**
 * Generate Caption menggunakan Google Gemini 1.5 Flash
 * Otomatis beralih ke Fallback Engine jika terjadi kegagalan/offline.
 */
export async function generateProductCaptions(input: CaptionGenerationInput): Promise<CaptionGenerationResult> {
  let rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const apiKey = rawKey ? rawKey.trim().replace(/^["']|["']$/g, "") : null;

  if (!apiKey) {
    console.warn("[Gemini API] API Key tidak ditemukan. Menggunakan Fallback Engine.");
    return {
      success: true,
      source: "fallback",
      captions: generateFallbackCaptions(input),
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
Anda adalah Asisten Creative Marketing & Copywriting profesional untuk UMKM lokal Indonesia, khususnya kuliner Sumatera Barat / Minang.

Buatkan 2 variasi teks caption promosi media sosial (Instagram & WhatsApp) berdasarkan data produk berikut:
- Nama Produk: ${input.productName}
- Harga: ${input.price ? formatRupiah(input.price) : "Tidak disebutkan"}
- Keunggulan Produk: ${input.advantages}
- Kategori: ${input.category || "Kuliner Minang"}
- Tujuan Promosi: ${input.goalType || "promo_diskon"}
- Karakter Komunikasi: ${input.toneOfVoice || "ramah_santai"}
- Lokasi UMKM: ${input.location || "Sumatera Barat"}

FORMAT RESPONSE HARUS BERUPA JSON VALID dengan struktur:
{
  "captions": [
    {
      "id": "option_a_storytelling",
      "styleLabel": "Storytelling Hangat (Menggugah Selera)",
      "hook": "Kalimat pembuka pemikat (1 kalimat)",
      "text": "Teks caption lengkap siap salin (termasuk hook, cerita rasa, keunggulan dalam poin emoji, harga, CTA, dan tagar)",
      "callToAction": "Kalimat ajakan bertindak",
      "hashtags": ["#Tagar1", "#Tagar2", "#Tagar3", "#Tagar4", "#Tagar5"]
    },
    {
      "id": "option_b_direct_promo",
      "styleLabel": "Promo To The Point (Hard-Selling)",
      "hook": "Kalimat pembuka heboh diskon/promo (1 kalimat)",
      "text": "Teks caption lengkap siap salin dengan fokus urgensi, keunggulan, harga, CTA instan, dan tagar",
      "callToAction": "Kalimat ajakan bertindak",
      "hashtags": ["#Tagar1", "#Tagar2", "#Tagar3", "#Tagar4", "#Tagar5"]
    }
  ]
}
`;

    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
    ];
    let result: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout Gemini 4s")), 4000)
        );
        result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
        if (result) break;
      } catch (err: any) {
        // Coba model berikutnya jika model tidak ditemukan
      }
    }

    if (!result) {
      throw new Error("Semua model Gemini candidate tidak merespon, beralih ke fallback generator.");
    }
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    if (parsed && Array.isArray(parsed.captions) && parsed.captions.length >= 2) {
      return {
        success: true,
        source: "gemini",
        captions: parsed.captions,
      };
    }

    throw new Error("Format respons Gemini tidak sesuai");
  } catch (error) {
    console.error("[Gemini API Error] Terjadi kesalahan saat memanggil Gemini:", error);
    return {
      success: true,
      source: "fallback",
      captions: generateFallbackCaptions(input),
    };
  }
}

