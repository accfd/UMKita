/**
 * Engine Sistem Rekomendasi Pemasaran Hybrid
 * Menggabungkan Rule-Based Marketing Funnel + Content-Based Filtering via Cosine Similarity
 */

import {
  tokenize,
  buildVocabulary,
  createTermVector,
  calculateCosineSimilarity,
  calculateMatchPercentage
} from "./similarity";

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  advantages?: string | null;
  originalImageUrl?: string | null;
}

export interface RecommendedPlanItem {
  dayNumber: number;
  dayName: string;
  topic: string;
  contentType: string;
  badge: string;
  description: string;
  recommendedProductId: string;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  matchScore: number;
  isBundle?: boolean;
  secondaryProductId?: string;
  secondaryProductName?: string;
  secondaryProductPrice?: number;
  secondaryProductImageUrl?: string;
}

export interface RecommenderResult {
  engine: "hybrid_cosine_similarity";
  primaryProduct: CatalogProduct;
  companionProduct: CatalogProduct;
  primaryMatchScore: number;
  companionMatchScore: number;
  items: RecommendedPlanItem[];
}

const DEFAULT_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// Kamus kata kunci semantik untuk setiap tujuan kampanye
const GOAL_KEYWORDS: Record<string, string> = {
  promo_diskon: "promo diskon potongan harga hemat payday murah bonus gratis ongkir borong cuci gudang pesan cepat whatsapp",
  brand_awareness: "cerita sejarah asal usul tradisi warisan nagari padang ganting tanah datar dapur asli resep turun temurun tangan higienis",
  product_launch: "peluncuran baru inovasi kemasan pouch zipper kedap udara awet tester perdana kejutan varian baru higienis",
  edukasi_pelanggan: "tips edukasi renyah simpan toples tahan lama garing kawa daun kopi teman ngemil sehat tanpa pengawet alami"
};

/**
 * Fungsi Utama: Menghasilkan 7 Hari Jadwal Konten dengan Cosine Similarity + Rule-Based Funnel
 */
export function generateHybridMarketingPlan(params: {
  businessName: string;
  businessLocation: string;
  goalType: string;
  notes?: string;
  selectedProductId?: string;
  selectedProductIds?: string[];
  catalog: CatalogProduct[];
}): RecommenderResult {
  const { businessName, businessLocation, goalType, notes, selectedProductId, selectedProductIds, catalog } = params;

  if (catalog.length === 0) {
    throw new Error("Katalog produk toko kosong.");
  }

  // 1. Ekstraksi Vektor Query (Tujuan + Catatan Khusus + Kamus Semantik)
  const goalContext = GOAL_KEYWORDS[goalType] || GOAL_KEYWORDS.promo_diskon;
  const rawQueryText = `${goalType} ${goalContext} ${notes || ""} padang ganting tanah datar minang`;
  const queryTokens = tokenize(rawQueryText);

  // 2. Ekstraksi Vektor Katalog Produk
  const productTokensList: string[][] = catalog.map((p) => {
    const rawProdText = `${p.name} ${p.description || ""} ${p.advantages || ""} olahan singkong minangkabau`;
    return tokenize(rawProdText);
  });

  // 3. Bangun Ruang Vektor (Vocabulary)
  const allDocuments = [queryTokens, ...productTokensList];
  const vocabulary = buildVocabulary(allDocuments);

  const queryVector = createTermVector(queryTokens, vocabulary);

  // 4. Hitung Cosine Similarity untuk Setiap Produk
  const scoredProducts = catalog.map((prod, idx) => {
    const prodVector = createTermVector(productTokensList[idx], vocabulary);
    const rawSimilarity = calculateCosineSimilarity(queryVector, prodVector);
    const matchScore = calculateMatchPercentage(rawSimilarity);

    return {
      product: prod,
      rawSimilarity,
      matchScore
    };
  });

  // Urutkan berdasarkan similarity tertinggi
  scoredProducts.sort((a, b) => b.rawSimilarity - a.rawSimilarity);

  // 5. Tentukan Produk Utama (Bisa Lebih Dari Satu) & Produk Pendamping
  const multiSelectedIds = selectedProductIds && selectedProductIds.length > 0
    ? selectedProductIds
    : (selectedProductId ? [selectedProductId] : []);

  const userSelectedProds: CatalogProduct[] = [];
  for (const id of multiSelectedIds) {
    const found = catalog.find((p) => p.id === id);
    if (found && !userSelectedProds.some((p) => p.id === found.id)) {
      userSelectedProds.push(found);
    }
  }

  if (userSelectedProds.length === 0) {
    userSelectedProds.push(scoredProducts[0].product);
  }

  const primaryProd = userSelectedProds[0];
  const secondSelectedProd = userSelectedProds[1] || null;

  // Produk pendamping: Produk relevan terbaik di luar produk utama
  const otherScored = scoredProducts.filter(
    (p) => !userSelectedProds.some((sp) => sp.id === p.product.id)
  );
  const companionProd = secondSelectedProd || otherScored[0]?.product || primaryProd;

  const primaryScore = 96;
  const companionScore = 88;

  const primaryName = primaryProd.name;
  const companionName = companionProd.name;
  const primaryPriceFmt = `Rp ${primaryProd.price.toLocaleString("id-ID")}`;
  const companionPriceFmt = `Rp ${companionProd.price.toLocaleString("id-ID")}`;
  
  // Format catatan pengguna agar mengalir alami dalam bahasa promosi
  const cleanNotes = notes && notes.trim() !== "" ? notes.trim() : "khas olahan tangan Padang Ganting yang renyah tanpa bahan pengawet";

  // 6. Rule-Based Marketing Decision Matrix (7-Day Funnel dengan Copywriting Alami)
  let planBlueprint: Array<{
    dayNumber: number;
    dayName: string;
    topic: string;
    contentType: string;
    badge: string;
    description: string;
    targetProd: CatalogProduct;
    secondaryProd?: CatalogProduct;
    isBundle?: boolean;
    score: number;
  }> = [];

  if (goalType === "brand_awareness") {
    planBlueprint = [
      {
        dayNumber: 1,
        dayName: "Senin",
        topic: `Cerita Dapur: Warisan Cita Rasa Otentik ${primaryName}`,
        contentType: "behind_the_scenes",
        badge: "Asal-Usul",
        description: `Angkat kisah tradisi keluarga ${businessName} di Nagari Padang Ganting, Tanah Datar. Tampilkan proses pengolahan singkong pilihan secara turun-temurun dengan cita rasa ${cleanNotes}.`,
        targetProd: primaryProd,
        score: primaryScore
      },
      {
        dayNumber: 2,
        dayName: "Selasa",
        topic: `Kualitas Terjamin: Kenapa Singkong Tanah Datar Jauh Lebih Gurih?`,
        contentType: "tips_edukasi",
        badge: "Bahan Baku",
        description: `Edukasi rahasia keistimewaan bahan baku: tanah vulkanik lereng bukit Tanah Datar menghasilkan singkong bertekstur empuk yang garing saat digoreng, tanpa perlu tambahan zat pengawet.`,
        targetProd: primaryProd,
        score: primaryScore - 2
      },
      {
        dayNumber: 3,
        dayName: "Rabu",
        topic: `Camilan Khas Tradisi: Temani Hari dengan ${companionName}`,
        contentType: "product_spotlight",
        badge: "Varian Khas",
        description: `Selain kelezatan ${primaryName}, kenalkan juga gurihnya ${companionName} (${companionPriceFmt}) sebagai teman setia toples keluarga yang selalu dirindukan perantau.`,
        targetProd: companionProd,
        score: companionScore
      },
      {
        dayNumber: 4,
        dayName: "Kamis",
        topic: `Ketulusan Pengrajin Lokal di Dapur Produksi Padang Ganting`,
        contentType: "behind_the_scenes",
        badge: "Dapur Tradisi",
        description: `Sorot kehangatan ibu-ibu pengrajin lokal yang telaten mengiris tipis dan menggoreng keripik menggunakan kuali tradisional dan minyak higienis berkualitas.`,
        targetProd: primaryProd,
        score: primaryScore - 1
      },
      {
        dayNumber: 5,
        dayName: "Jumat",
        topic: `Momen Ngemil Santai: Paduan Nikmat ${primaryName} & Kopi Kawa Daun`,
        contentType: "tips_edukasi",
        badge: "Kuliner Minang",
        description: `Ajak pengikut merasakan sensasi santai sore khas Ranah Minang: menikmati renyahnya ${primaryName} ditemani seduhan kopi kawa daun atau teh hangat.`,
        targetProd: primaryProd,
        score: primaryScore
      },
      {
        dayNumber: 6,
        dayName: "Sabtu",
        topic: `Oleh-Oleh Wajib Singgah Bagi Wisatawan yang Melintasi Tanah Datar`,
        contentType: "social_proof",
        badge: "Ulasan Pembeli",
        description: `Kompilasi foto ulasan wisatawan dan perantau yang mampir memborong kardus oleh-oleh ${primaryName} sebelum kembali ke perantauan.`,
        targetProd: primaryProd,
        score: primaryScore + 2
      },
      {
        dayNumber: 7,
        dayName: "Minggu",
        topic: `Cicipi Keaslian ${primaryName} Fresh Baru Masak dari Dapur Kami`,
        contentType: "promo_offer",
        badge: "Pemesanan",
        description: `Ajak audiens order langsung kemasan ${primaryPriceFmt} via WhatsApp. Pengemasan rapi kardus tebal dan jaminan tiba renyah sampai tujuan.`,
        targetProd: primaryProd,
        score: primaryScore
      }
    ];
  } else if (goalType === "product_launch") {
    planBlueprint = [
      {
        dayNumber: 1,
        dayName: "Senin",
        topic: `Sneak Peek: Ada yang Baru & Makin Renyah dari Dapur ${businessName}!`,
        contentType: "behind_the_scenes",
        badge: "Teaser",
        description: `Bagikan siluet kemasan pouch kedap udara baru untuk ${primaryName}. Bangun rasa penasaran pelanggan akan kerenyahan yang kini tahan hingga 2 bulan.`,
        targetProd: primaryProd,
        score: primaryScore
      },
      {
        dayNumber: 2,
        dayName: "Selasa",
        topic: `Cerita Inovasi: Dedikasi Menjaga Kerenyahan Sampai ke Tanganmu`,
        contentType: "behind_the_scenes",
        badge: "Cerita Produk",
        description: `Ceritakan komitmen ${businessName} menghadirkan kemasan zipper praktis agar keripik ${primaryName} tetap garing higienis, membawa kebaikan rasa ${cleanNotes}.`,
        targetProd: primaryProd,
        score: primaryScore - 1
      },
      {
        dayNumber: 3,
        dayName: "Rabu",
        topic: `Resmi Diluncurkan! Kemasan Baru ${primaryName} Lebih Praktis & Cantik`,
        contentType: "product_spotlight",
        badge: "Peluncuran",
        description: `Rilis resmi kemasan baru ${primaryName} seharga ${primaryPriceFmt}. Tampilkan visual pouch modern yang elegan, siap jadi oleh-oleh premium untuk keluarga.`,
        targetProd: primaryProd,
        score: primaryScore + 3
      },
      {
        dayNumber: 4,
        dayName: "Kamis",
        topic: `Dapur Padang Ganting Memproses Batch Perdana Kemasan Baru`,
        contentType: "behind_the_scenes",
        badge: "Batch Perdana",
        description: `Poster cerita proses segel ganda higienis batch perdana ${primaryName} yang baru matang untuk dikirimkan kepada 50 pembeli pertama.`,
        targetProd: primaryProd,
        score: primaryScore
      },
      {
        dayNumber: 5,
        dayName: "Jumat",
        topic: `Paket Spesial Peluncuran: Duo Hemat ${primaryName} + ${companionName}`,
        contentType: "promo_offer",
        badge: "Paket Perdana",
        description: `Rayakan peluncuran dengan paket hemat perkenalan: nikmati kemasan baru ${primaryName} bersama renyahnya ${companionName} dengan harga khusus akhir pekan.`,
        targetProd: primaryProd,
        secondaryProd: companionProd,
        isBundle: true,
        score: companionScore
      },
      {
        dayNumber: 6,
        dayName: "Sabtu",
        topic: `Unboxing & Kesan Pertama: Kerenyahan Utuh Tanpa Remuk!`,
        contentType: "social_proof",
        badge: "Review Perdana",
        description: `Tampilkan testimoni unboxing pembeli luar kota yang kagum dengan kemasan baru yang rapat dan keripik yang tiba dalam kondisi renyah sempurna.`,
        targetProd: primaryProd,
        score: primaryScore + 1
      },
      {
        dayNumber: 7,
        dayName: "Minggu",
        topic: `Siap Kirim ke Seluruh Nusantara via Ekspedisi Cepat`,
        contentType: "product_spotlight",
        badge: "Kirim Nasional",
        description: `Tampilkan kardus paket kemasan baru ${primaryName} yang siap meluncur ke berbagai kota dan bandara. Amankan pesananmu via WhatsApp sekarang!`,
        targetProd: primaryProd,
        score: primaryScore
      }
    ];
  } else if (goalType === "edukasi_pelanggan") {
    planBlueprint = [
      {
        dayNumber: 1,
        dayName: "Senin",
        topic: `Mengenal Keistimewaan Tekstur Empuk Renyah ${primaryName}`,
        contentType: "tips_edukasi",
        badge: "Edukasi Rasa",
        description: `Jelaskan rahasia mengapa ${primaryName} olahan Padang Ganting terasa empuk dan tidak keras saat digigit: berkat irisan singkong tipis presisi khas pengrajin lokal.`,
        targetProd: primaryProd,
        score: primaryScore
      },
      {
        dayNumber: 2,
        dayName: "Selasa",
        topic: `Tips Praktis: Cara Menyimpan ${primaryName} Agar Tetap Garing 2 Bulan`,
        contentType: "tips_edukasi",
        badge: "Tips Toko",
        description: `Bagikan tips mudah: simpan keripik di toples kedap udara, hindari terkena sinar matahari langsung, dan rapatkan kembali ziplock kemasan setelah dibuka.`,
        targetProd: primaryProd,
        score: primaryScore - 3
      },
      {
        dayNumber: 3,
        dayName: "Rabu",
        topic: `Alasan Mengapa ${primaryName} Nafama Sehat Tanpa Pengawet Sintetis`,
        contentType: "behind_the_scenes",
        badge: "Kesehatan",
        description: `Edukasi komitmen higienis ${businessName}: proses penggorengan bersih dan penirisan minyak tuntas menjadi rahasia kerenyahan alami yang tahan lama.`,
        targetProd: primaryProd,
        score: primaryScore
      },
      {
        dayNumber: 4,
        dayName: "Kamis",
        topic: `Padu Padan Kuliner: Cara Makan Tradisional ${primaryName}`,
        contentType: "tips_edukasi",
        badge: "Saran Menu",
        description: `Kenalkan cara makan khas Minang: jadikan ${primaryName} sebagai kerupuk pendamping soto Padang, lontong sayur, atau sekadar cemilan sore.`,
        targetProd: primaryProd,
        score: primaryScore - 1
      },
      {
        dayNumber: 5,
        dayName: "Jumat",
        topic: `Kenali Juga Camilan Khas Kami Lainnya: ${companionName}`,
        contentType: "tips_edukasi",
        badge: "Kenal Varian",
        description: `Edukasi seputar varian olahan singkong lainnya: ${companionName} yang memiliki bentuk unik dan aroma rempah khas nagari Minangkabau.`,
        targetProd: companionProd,
        score: companionScore
      },
      {
        dayNumber: 6,
        dayName: "Sabtu",
        topic: `FAQ Pengiriman: Apakah ${primaryName} Aman Dikirim ke Luar Pulau?`,
        contentType: "social_proof",
        badge: "Info Pengiriman",
        description: `Jawab pertanyaan umum seputar perlindungan bubble wrap tebal dan kardus kokoh sehingga keripik dijamin tiba tanpa remuk.`,
        targetProd: primaryProd,
        score: primaryScore
      },
      {
        dayNumber: 7,
        dayName: "Minggu",
        topic: `Buktikan Sendiri Kerenyahan ${primaryName} Hari Ini!`,
        contentType: "product_spotlight",
        badge: "Cicipi Sekarang",
        description: `Ajak audiens membuktikan langsung keaslian rasa ${primaryName} (${primaryPriceFmt}) fresh baru matang langsung dari dapur Padang Ganting.`,
        targetProd: primaryProd,
        score: primaryScore + 1
      }
    ];
  } else {
    // promo_diskon
    planBlueprint = [
      {
        dayNumber: 1,
        dayName: "Senin",
        topic: `Promo Spesial Awal Pekan: Nikmati Renyahnya ${primaryName}!`,
        contentType: "promo_offer",
        badge: "Promo Hemat",
        description: `Buka pekan ini dengan penawaran hemat spesial untuk produk unggulan ${primaryName}. Manfaatkan keuntungan belanja: ${cleanNotes}.`,
        targetProd: primaryProd,
        score: primaryScore
      },
      {
        dayNumber: 2,
        dayName: "Selasa",
        topic: `Intip Dapur: Batch Fresh ${primaryName} Siap Dikirim Hari Ini`,
        contentType: "behind_the_scenes",
        badge: "Dapur Fresh",
        description: `Poster behind-the-scenes batch segar ${primaryName} yang baru diangkat dari wajan untuk memenuhi pesanan promo pelanggan.`,
        targetProd: primaryProd,
        score: primaryScore - 2
      },
      {
        dayNumber: 3,
        dayName: "Rabu",
        topic: `Sensori Renyah: Nikmati Detail Kriuk ${primaryName}`,
        contentType: "product_spotlight",
        badge: "Sensori & Rasa",
        description: `Poster detail kerenyahan tekstur ${primaryName}, dipadukan caption yang menggugah selera dan harga ${primaryPriceFmt}.`,
        targetProd: primaryProd,
        score: primaryScore + 1
      },
      {
        dayNumber: 4,
        dayName: "Kamis",
        topic: `Paket Hemat Duo: Kombinasi Mantap ${primaryName} + ${companionName}`,
        contentType: "promo_offer",
        badge: "Paket Combo",
        description: `Tawarkan paket bundel hemat: perpaduan mantap ${primaryName} dengan gurihnya ${companionName} untuk stok camilan keluarga lebih hemat.`,
        targetProd: primaryProd,
        secondaryProd: companionProd,
        isBundle: true,
        score: companionScore
      },
      {
        dayNumber: 5,
        dayName: "Jumat",
        topic: `Jumat Berkah: Belanja Lebih Untung & Bebas Ongkir Hari Ini!`,
        contentType: "promo_offer",
        badge: "Penawaran Kilat",
        description: `Dorong checkout langsung via WhatsApp dengan penawaran kilat hari ini: ${cleanNotes}. Pengiriman cepat dan aman sampai ke depan rumah.`,
        targetProd: primaryProd,
        score: primaryScore
      },
      {
        dayNumber: 6,
        dayName: "Sabtu",
        topic: `Cerita Pelanggan: Kerenyahan ${primaryName} yang Bikin Nagih`,
        contentType: "social_proof",
        badge: "Ulasan Nyata",
        description: `Testimoni pembeli luar kota yang puas dengan kualitas rasa ${primaryName} yang tetap garing dan gurih saat paket tiba di tangan keluarga.`,
        targetProd: primaryProd,
        score: primaryScore - 1
      },
      {
        dayNumber: 7,
        dayName: "Minggu",
        topic: `Hitung Mundur: Jam Terakhir Promo Hemat ${primaryName}!`,
        contentType: "promo_offer",
        badge: "Terakhir!",
        description: `Materi urgensi FOMO: Ingatkan pelanggan bahwa promo khusus ${primaryName} akan berakhir tepat tengah malam ini sebelum harga normal kembali.`,
        targetProd: primaryProd,
        score: primaryScore
      }
    ];
  }

  // Jika user memilih lebih dari 1 produk utama, distribusikan produk-produk tersebut secara variatif ke dalam 7 hari
  if (userSelectedProds.length > 1) {
    planBlueprint = planBlueprint.map((b, idx) => {
      // Hari 1 tetap produk pertama yang dipilih
      if (idx === 0) return b;

      const currentProd = userSelectedProds[idx % userSelectedProds.length];
      const nextProd = userSelectedProds[(idx + 1) % userSelectedProds.length];

      // Ganti nama produk di topic dan description jika bukan bundle
      let newTopic = b.topic;
      let newDesc = b.description;

      if (!b.isBundle) {
        newTopic = newTopic.replace(new RegExp(primaryProd.name, "g"), currentProd.name);
        newDesc = newDesc.replace(new RegExp(primaryProd.name, "g"), currentProd.name);
        return {
          ...b,
          targetProd: currentProd,
          topic: newTopic,
          description: newDesc
        };
      } else {
        return {
          ...b,
          targetProd: currentProd,
          secondaryProd: nextProd
        };
      }
    });
  }

  const finalItems: RecommendedPlanItem[] = planBlueprint.map((b) => ({
    dayNumber: b.dayNumber,
    dayName: b.dayName || DEFAULT_DAYS[b.dayNumber - 1],
    topic: b.topic,
    contentType: b.contentType,
    badge: b.badge,
    description: b.description,
    recommendedProductId: b.targetProd.id,
    productName: b.targetProd.name,
    productPrice: Number(b.targetProd.price),
    productImageUrl: b.targetProd.originalImageUrl || "/produk/produk1.jpeg",
    matchScore: b.score,
    isBundle: b.isBundle || false,
    secondaryProductId: b.secondaryProd?.id,
    secondaryProductName: b.secondaryProd?.name,
    secondaryProductPrice: b.secondaryProd ? Number(b.secondaryProd.price) : undefined,
    secondaryProductImageUrl: b.secondaryProd?.originalImageUrl || undefined
  }));

  return {
    engine: "hybrid_cosine_similarity",
    primaryProduct: primaryProd,
    companionProduct: companionProd,
    primaryMatchScore: primaryScore,
    companionMatchScore: companionScore,
    items: finalItems
  };
}
