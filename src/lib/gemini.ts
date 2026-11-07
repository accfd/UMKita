import { GoogleGenerativeAI } from "@google/generative-ai";

export interface CaptionGenerationInput {
  productName: string;
  price?: number | string;
  advantages: string;
  category?: string;
  goalType?: string; // "promo_diskon" | "produk_baru" | "oleh_oleh" | "kualitas"
  targetAudience?: string; // "wisatawan" | "anak_muda" | "keluarga" | "pecinta_pedas"
  toneOfVoice?: string; // "tradisional" | "klasik" | "modern" | "minimalis" | "ceria" | "natural"
  location?: string;
  variationIndex?: number;
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
 * Fallback Context-Aware Engine
 * Menghasilkan naskah yang sangat dinamis, bervariasi, dan tidak monoton
 * sesuai kombinasi Tujuan Promosi, Target Audiens, dan Gaya Branding
 */
export function generateFallbackCaptions(input: CaptionGenerationInput): GeneratedCaptionOption[] {
  const formattedPrice = input.price ? formatRupiah(input.price) : "Rp 25.000";
  const location = input.location || "Padang Ganting, Tanah Datar, Sumatera Barat";
  const rawAdv = input.advantages || "Rasa autentik, bumbu rempah pilihan, renyah maksimal, bebas bahan kimia";
  const advantagesList = rawAdv.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  const bulletAdvantages = advantagesList.map((adv) => `✨ ${adv}`).join("\n");

  const goal = input.goalType || "promo_diskon";
  const audience = input.targetAudience || "wisatawan";
  const tone = input.toneOfVoice || "tradisional";
  const v = (input.variationIndex || 0) % 3;

  let hookA = "";
  let storyBodyA = "";
  let ctaA = "";
  let tagsA: string[] = [];

  let hookB = "";
  let promoBodyB = "";
  let ctaB = "";
  let tagsB: string[] = [];

  // 1. Tentukan konten berdasarkan Target Audiens & Tujuan Promosi
  if (audience === "wisatawan") {
    if (goal === "oleh_oleh") {
      hookA = v === 0
        ? "Bawa pulang kelezatan Ranah Minang yang asli ke rumah! 🎒⛰️"
        : v === 1
        ? "Belum lengkap singgah di Tanah Datar kalau belum bawa buah tangan ini! 🌿"
        : "Obat rindu kampung halaman: gurihnya renyah tak tergantikan! ✈️💛";
      storyBodyA = `Siapa yang lagi jalan-jalan atau mudik ke Sumatera Barat? Jangan sampai pulang dengan tangan kosong ya, Sanak!

Kenalkan ${input.productName} dari Sanjai Nafama. Diracik langsung di Nagari ${location} dengan resep turun-temurun asli Minangkabau. Kemasannya higienis, rapat, dan tahan renyah hingga 2 bulan—sangat aman dibawa perjalanan jauh naik pesawat maupun mobil.

Keistimewaan ${input.productName}:
${bulletAdvantages}
💰 Harga sahabat: Cuma ${formattedPrice} per kemasan oleh-oleh!`;
      ctaA = "Beli langsung di gerai kami atau pesan via WhatsApp untuk dikirim ke kotamu! 📲📦";
      tagsA = ["#OlehOlehMinang", "#SanjaiNafama", "#WisataSumbar", "#KulinerTradisional", "#PadangGanting"];

      hookB = "🎒 PAKET OLEH-OLEH KHAS MINANG: PRAKTIS, AMAN & TAHAN LAMA!";
      promoBodyB = `Mau bawain oleh-oleh khas Padang buat tetangga & teman kantor tanpa ribet?
Pilih ${input.productName.toUpperCase()}!
Harga resmi toko: ${formattedPrice}
Keunggulan:
${bulletAdvantages}
Bisa langsung kirim ke seluruh Indonesia dengan kardus pelindung ekstra!`;
      ctaB = "Pesan sekarang via WhatsApp sebelum stok oleh-oleh hari ini habis! 📲👇";
      tagsB = ["#OlehOlehPadang", "#KhasMinang", "#KirimNusantara", "#CamilanMinang", "#PusatOlehOleh"];
    } else {
      hookA = "Jelajah rasa Minangkabau dalam setiap gigitan renyah! 🌶️✨";
      storyBodyA = `Bagi para perantau dan pelancong yang rindu cita rasa otentik Padang Ganting, ${input.productName} siap mengobati rasa rindumu. Bumbunya meresap sempurna, renyah kriuknya bikin nostalgia.

Kelebihan ${input.productName}:
${bulletAdvantages}
🏷️ Harga istimewa: ${formattedPrice}`;
      ctaA = "Klik link di bio untuk order kilat via WhatsApp! 📲📦";
      tagsA = ["#KulinerMinang", "#OlehOlehNusantara", "#SanjaiNafama", "#RasaMinang", "#TradisiLokal"];

      hookB = `⚡ PROMO SPESIAL PERANTAU & WISATAWAN: ${input.productName.toUpperCase()}!`;
      promoBodyB = `Nikmati penawaran khusus ${input.productName} langsung dari dapur produksi kami di ${location}.
💰 Harga promo: ${formattedPrice}
${bulletAdvantages}
Pengiriman kilat ke seluruh kota!`;
      ctaB = "Amankan paketmu sekarang juga via WhatsApp! 📲";
      tagsB = ["#DiskonOlehOleh", "#PromoMinang", "#CamilanRenyah", "#FastShipping", "#UMKMMinang"];
    }
  } else if (audience === "anak_muda") {
    hookA = v === 0
      ? `Fix no debat, kriuknya ${input.productName} bener-bener candu parah! 🤤🔥`
      : v === 1
      ? "Teman sejati pas nugas, maraton drakor, atau mabar game! 🎮✨"
      : "Sekali gigit langsung paham kenapa ini camilan ter-favorit! 💯💥";
    storyBodyA = `Lagi gabut dan butuh camilan yang rasanya nendang pol? 

Cobain ${input.productName} dari Sanjai Nafama! Renyahnya gak ada lawan, gurihnya pas, dan yang terpenting: bumbu alaminya melimpah ruah di setiap gigitan!

Kenapa wajib nyetok ini di kamar?
${bulletAdvantages}
💸 Cuma ${formattedPrice} aja, kantong aman ngemil kenyang!`;
    ctaA = "Pesan sekarang langsung lewat DM atau klik link WhatsApp di bio! 🛒📲";
    tagsA = ["#CamilanHits", "#JajananEnak", "#CamilanNonton", "#KriukNagih", "#SanjaiNafama"];

    hookB = `🔥 FLASH SALE CEMILAN GURIH: ${input.productName.toUpperCase()}! 🔥`;
    promoBodyB = `Jangan sampai kehabisan stok ngemil minggu ini!
Dapatkan ${input.productName} dengan harga hemat hanya ${formattedPrice}!
${bulletAdvantages}
Renyah, gurih, bumbu melimpah tanpa pengawet buatan!`;
    ctaB = "Checkout sekarang via link bio sebelum kehabisan! ⚡📲";
    tagsB = ["#JajananKekinian", "#PromoNgemil", "#DiskonCamilan", "#AnakMudaNgemil", "#SnackEnak"];
  } else if (audience === "keluarga") {
    hookA = v === 0
      ? "Sajikan kehangatan tradisi untuk kumpul santai keluarga tercinta! 👨‍👩‍👧‍👦❤️"
      : v === 1
      ? "Camilan renyah sehat yang disukai anak-anak hingga kakek nenek! 🌿✨"
      : "Teman ngeteh & ngopi sore paling pas di rumah! ☕🏡";
    storyBodyA = `Waktu kumpul keluarga di rumah jadi makin hangat dengan suguhan toples berisi ${input.productName} dari Sanjai Nafama.

Dibuat dari bahan-bahan pilihan tanpa pewarna maupun pengawet kimia berbahaya, sehingga aman dan menyehatkan untuk seluruh anggota keluarga di rumah.

Keunggulan mutu:
${bulletAdvantages}
🏷️ Harga ramah keluarga: Cuma ${formattedPrice}`;
    ctaA = "Yuk sediakan stok camilan sehat keluarga sekarang via WhatsApp! 📲📦";
    tagsA = ["#CamilanKeluarga", "#MomenKeluarga", "#SnackSehat", "#SanjaiNafama", "#KulinerRumahan"];

    hookB = `👨‍👩‍👧‍👦 PAKET HEMAT KELUARGA: ${input.productName.toUpperCase()}!`;
    promoBodyB = `Belanja camilan sehat dan renyah untuk stok toples ruang tamu keluarga!
${input.productName} diolah higienis dan halal 100%.
Harga terjangkau: ${formattedPrice}
${bulletAdvantages}`;
    ctaB = "Pesan sekarang untuk pengiriman langsung ke alamat rumahmu! 📲👇";
    tagsB = ["#PaketKeluarga", "#CamilanTradisi", "#HalalMUI", "#SanjaiPadang", "#KeluargaHarmonis"];
  } else {
    // Default: Pecinta Pedas / Rasa Otentik
    hookA = v === 0
      ? "Sensasi gurih renyah bumbu khas Minang yang bikin merem melek! 🌶️🤤"
      : v === 1
      ? "Sekali kunyah, suara renyahnya terdengar sampai ke hati! 💥✨"
      : "Camilan otentik Padang Ganting dengan bumbu racikan asli! 🌿🔥";
    storyBodyA = `Buat kamu penikmat kuliner sejati, kenikmatan ${input.productName} dari Sanjai Nafama ini wajib masuk daftar jajananmu!

Diolah tradisional dari bahan singkong/kulit pilihan nagari Tanah Datar dengan kerenyahan maksimal dan bumbu lado gurih yang meresap sempurna.

Alasan wajib coba:
${bulletAdvantages}
💰 Cuma ${formattedPrice}!`;
    ctaA = "Order sekarang via WhatsApp di link bio untuk promo pekan ini! 📲📦";
    tagsA = ["#KulinerPedas", "#SanjaiNafama", "#CamilanMinang", "#GurihRenyah", "#PedasNagih"];

    hookB = `🌶️ PROMO SPESIAL PEDAS GURIH: ${input.productName.toUpperCase()}!`;
    promoBodyB = `Nikmati kerenyahan ${input.productName} dengan baluran bumbu istimewa!
Harga spesial: ${formattedPrice}
${bulletAdvantages}`;
    ctaB = "Langsung amankan pesananmu via WhatsApp sekarang! 📲🔥";
    tagsB = ["#PedasGila", "#KulinerSumbar", "#PromoSpesial", "#CamilanEnak", "#OrderOnline"];
  }

  // Tambahkan nuansa tone of voice
  const labelA = tone === "ceria"
    ? "Gaya Ceria & Enerjik (Fun Storytelling)"
    : tone === "modern"
    ? "Gaya Modern & Kekinian (Trendy Casual)"
    : tone === "klasik"
    ? "Gaya Nostalgia Tempo Dulu (Heritage Warmth)"
    : tone === "minimalis"
    ? "Gaya Editorial Elegan (Clean & Focused)"
    : "Gaya Tradisional Otentik (Storytelling Minang)";

  const labelB = "Gaya Promosi Langsung (Hard-Selling To The Point)";

  const optionA: GeneratedCaptionOption = {
    id: `opt_story_${v}_${Date.now()}`,
    styleLabel: labelA,
    hook: hookA,
    callToAction: ctaA,
    hashtags: tagsA,
    text: `${hookA}

${storyBodyA}

${ctaA}

${tagsA.join(" ")}`,
  };

  const optionB: GeneratedCaptionOption = {
    id: `opt_promo_${v}_${Date.now()}`,
    styleLabel: labelB,
    hook: hookB,
    callToAction: ctaB,
    hashtags: tagsB,
    text: `${hookB}

${promoBodyB}

${ctaB}

${tagsB.join(" ")}`,
  };

  return [optionA, optionB];
}

export async function generateProductCaptions(input: CaptionGenerationInput): Promise<CaptionGenerationResult> {
  const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const apiKey = rawKey ? rawKey.trim().replace(/^["']|["']$/g, "") : null;

  if (!apiKey) {
    return {
      success: true,
      source: "fallback",
      captions: generateFallbackCaptions(input),
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
Anda adalah Creative Director & Head of Copywriting profesional untuk UMKM kuliner Sumatera Barat / Minang (Sanjai Nafama).
Buatkan 2 variasi teks caption promosi media sosial (Instagram Feed & WhatsApp Story) yang SANGAT DINAMIS, VARIATIF, DAN TIDAK MONOTON.

Data Konteks Pemasaran:
- Nama Produk: ${input.productName}
- Harga Jual: ${input.price ? formatRupiah(input.price) : "Rp 25.000"}
- Keunggulan Produk: ${input.advantages}
- Kategori Produk: ${input.category || "Oleh-oleh Khas Minangkabau"}
- Tujuan Promosi: ${input.goalType || "promo_diskon"} (sesuaikan urgensi dan fokus pesan)
- Target Audiens: ${input.targetAudience || "wisatawan"} (sesuaikan panggilan, gaya bahasa, dan situasi konsumsi)
- Gaya Branding: ${input.toneOfVoice || "tradisional"} (sesuaikan estetika kosakata)
- Lokasi UMKM: ${input.location || "Padang Ganting, Tanah Datar, Sumatera Barat"}

Instruksi Khusus:
1. JANGAN gunakan kalimat pembuka klise atau template monoton yang sama.
2. Variasi A harus berupa pendekatan Storytelling & Emosional yang menggugah selera sesuai target audiens.
3. Variasi B harus berupa pendekatan Direct Promotion / Penawaran Cepat dengan fokus urgensi & CTA WhatsApp.
4. Gunakan bahasa Indonesia yang luwes, segar, kaya kosakata lokal Minang yang hangat bila relevan.

FORMAT RESPONSE HARUS BERUPA JSON VALID dengan format:
{
  "captions": [
    {
      "id": "option_a_storytelling",
      "styleLabel": "Pendekatan Storytelling & Emosional",
      "hook": "Kalimat pembuka yang memikat dan segar",
      "text": "Naskah caption lengkap siap salin (termasuk hook, cerita keunggulan, harga, CTA, tagar)",
      "callToAction": "Kalimat ajakan bertindak jelas",
      "hashtags": ["#Tagar1", "#Tagar2", "#Tagar3", "#Tagar4", "#Tagar5"]
    },
    {
      "id": "option_b_direct_promo",
      "styleLabel": "Pendekatan Penawaran Terarah (Hard-Sell)",
      "hook": "Kalimat pembuka promosi to the point",
      "text": "Naskah caption lengkap dengan fokus nilai dan pemesanan WhatsApp",
      "callToAction": "Kalimat ajakan beli cepat via WhatsApp",
      "hashtags": ["#Tagar1", "#Tagar2", "#Tagar3", "#Tagar4", "#Tagar5"]
    }
  ]
}
`;

    const candidateModels = ["gemini-2.5-flash", "gemini-1.5-flash"];
    let result: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.85,
          },
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout Gemini 4s")), 4000)
        );
        result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
        if (result) break;
      } catch (err: any) {
        // Coba model berikutnya
      }
    }

    if (!result) {
      throw new Error("Semua model Gemini candidate tidak merespon, beralih ke engine fallback.");
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
    console.warn("[Gemini API Fallback] Menggunakan context-aware fallback engine:", error);
    return {
      success: true,
      source: "fallback",
      captions: generateFallbackCaptions(input),
    };
  }
}
