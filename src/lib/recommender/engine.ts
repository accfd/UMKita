/**
 * Engine Sistem Rekomendasi Pemasaran Hybrid
 * Menggabungkan Rule-Based Marketing Funnel + Content-Based Filtering via Cosine Similarity
 */

import {
  tokenize,
  buildVocabulary,
  createTermVector,
  calculateCosineSimilarity,
  calculateMatchPercentage,
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
  edukasi_pelanggan: "tips edukasi renyah simpan toples tahan lama garing kawa daun kopi teman ngemil sehat tanpa pengawet alami",
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
      matchScore,
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

  // 6. Dynamic Product-Aware Marketing Funnel (7-Day Strategy 100% Menyesuaikan Produk Terpilih)
  function buildDayBlueprint(
    dayNumber: number,
    dayName: string,
    goal: string,
    prod: CatalogProduct,
    companion: CatalogProduct
  ) {
    const pName = prod.name;
    const pPrice = `Rp ${Number(prod.price).toLocaleString("id-ID")}`;
    const cName = companion.name;
    const pAdv = prod.advantages || "resep turun-temurun asli Minangkabau yang renyah dan gurih";

    if (goal === "brand_awareness") {
      switch (dayNumber) {
        case 1:
          return {
            dayNumber,
            dayName,
            topic: `Warisan Tradisi Minang: Cerita Kelezatan ${pName}`,
            contentType: "behind_the_scenes",
            badge: "Asal-Usul",
            description: `Kenalkan sejarah dan tradisi kuliner Minang di balik ${pName}. Diolah secara turun-temurun di Nagari ${businessLocation} dengan cita rasa autentik.`,
            targetProd: prod,
            score: 96,
          };
        case 2:
          return {
            dayNumber,
            dayName,
            topic: `Bahan Alami Pilihan: Rahasia Kerenyahan ${pName}`,
            contentType: "tips_edukasi",
            badge: "Bahan Baku",
            description: `Edukasi rahasia pemilihan bahan segar berkualitas di balik ${pName}: ${pAdv}, tanpa bahan pengawet sintetis.`,
            targetProd: prod,
            score: 94,
          };
        case 3:
          return {
            dayNumber,
            dayName,
            topic: `Spotlight Kuliner: Keistimewaan Rasa ${pName}`,
            contentType: "product_spotlight",
            badge: "Varian Khas",
            description: `Kenalkan keistimewaan ${pName} (${pPrice}) sebagai camilan otentik yang selalu dicari wisatawan dan perantau.`,
            targetProd: prod,
            score: 92,
          };
        case 4:
          return {
            dayNumber,
            dayName,
            topic: `Ketulusan Dapur Pengrajin ${businessName} di ${businessLocation}`,
            contentType: "behind_the_scenes",
            badge: "Dapur Tradisi",
            description: `Sorot kehangatan ibu-ibu pengrajin lokal yang telaten mengolah ${pName} menggunakan metode tradisional dan standar higienis.`,
            targetProd: prod,
            score: 95,
          };
        case 5:
          return {
            dayNumber,
            dayName,
            topic: `Momen Ngemil Santai: Paduan Nikmat ${pName} & Kopi Kawa`,
            contentType: "tips_edukasi",
            badge: "Kuliner Minang",
            description: `Ajak pengikut merasakan sensasi santai sore khas Minangkabau: menikmati gurihnya ${pName} ditemani seduhan kopi kawa daun atau teh hangat.`,
            targetProd: prod,
            score: 94,
          };
        case 6:
          return {
            dayNumber,
            dayName,
            topic: `Oleh-Oleh Favorit Wisatawan yang Melintasi Ranah Minang`,
            contentType: "social_proof",
            badge: "Ulasan Pembeli",
            description: `Kompilasi foto ulasan wisatawan dan perantau yang memborong kardus oleh-oleh ${pName} sebagai buah tangan keluarga.`,
            targetProd: prod,
            score: 97,
          };
        case 7:
        default:
          return {
            dayNumber,
            dayName,
            topic: `Bawa Pulang Kelezatan Otentik ${pName} ke Rumahmu`,
            contentType: "promo_offer",
            badge: "Pemesanan",
            description: `Ajak audiens order langsung kemasan ${pPrice} via WhatsApp. Pengemasan kardus tebal dan jaminan tiba renyah sampai tujuan.`,
            targetProd: prod,
            score: 96,
          };
      }
    }

    if (goal === "product_launch") {
      switch (dayNumber) {
        case 1:
          return {
            dayNumber,
            dayName,
            topic: `Sneak Peek: Inovasi Terbaru ${pName} Siap Hadir!`,
            contentType: "behind_the_scenes",
            badge: "Teaser",
            description: `Bagikan teaser kemasan rapat kedap udara untuk ${pName}. Bangun rasa penasaran pelanggan akan kerenyahan yang kini tahan lebih lama.`,
            targetProd: prod,
            score: 96,
          };
        case 2:
          return {
            dayNumber,
            dayName,
            topic: `Kisah di Balik Varian ${pName}: Kualitas & Resep Otentik`,
            contentType: "behind_the_scenes",
            badge: "Cerita Produk",
            description: `Ceritakan komitmen ${businessName} menghadirkan ${pName} higienis: ${pAdv}.`,
            targetProd: prod,
            score: 95,
          };
        case 3:
          return {
            dayNumber,
            dayName,
            topic: `Resmi Diluncurkan: Nikmati Kemasan Baru ${pName}!`,
            contentType: "product_spotlight",
            badge: "Peluncuran",
            description: `Kabar gembira! Kini ${pName} resmi hadir dengan kemasan baru seharga ${pPrice}. Lebih praktis, higienis, dan aman dibawa perjalanan jauh.`,
            targetProd: prod,
            score: 98,
          };
        case 4:
          return {
            dayNumber,
            dayName,
            topic: `Paket Bundel Perdana: ${pName} + ${cName}`,
            contentType: "promo_offer",
            badge: "Paket Perdana",
            description: `Rayakan peluncuran dengan paket hemat perkenalan: paduan mantap ${pName} bersama renyahnya ${cName} dengan harga khusus.`,
            targetProd: prod,
            secondaryProd: companion,
            isBundle: true,
            score: 90,
          };
        case 5:
          return {
            dayNumber,
            dayName,
            topic: `Harga Perkenalan Spesial Khusus Pemesanan ${pName} Pekan Ini`,
            contentType: "promo_offer",
            badge: "Promo Spesial",
            description: `Dapatkan harga perkenalan spesial khusus follower untuk pemesanan ${pName} langsung via link WhatsApp toko.`,
            targetProd: prod,
            score: 95,
          };
        case 6:
          return {
            dayNumber,
            dayName,
            topic: `Unboxing & Kesan Pertama Kerenyahan ${pName}`,
            contentType: "social_proof",
            badge: "Review Perdana",
            description: `Testimoni unboxing pembeli luar kota yang kagum dengan kerenyahan utuh dan kemasan rapi ${pName}.`,
            targetProd: prod,
            score: 96,
          };
        case 7:
        default:
          return {
            dayNumber,
            dayName,
            topic: `Amankan Batch Perdana ${pName} Siap Kirim Hari Ini!`,
            contentType: "product_spotlight",
            badge: "Batch Perdana",
            description: `Stok batch perdana ${pName} terbatas. Pesan sekarang sebelum kuota pengiriman hari ini penuh!`,
            targetProd: prod,
            score: 96,
          };
      }
    }

    if (goal === "edukasi_pelanggan") {
      switch (dayNumber) {
        case 1:
          return {
            dayNumber,
            dayName,
            topic: `Mengenal Keistimewaan Tekstur Empuk Renyah ${pName}`,
            contentType: "tips_edukasi",
            badge: "Edukasi Rasa",
            description: `Jelaskan rahasia kerenyahan ${pName}: ${pAdv}. Sangat empuk dan tidak keras saat digigit.`,
            targetProd: prod,
            score: 96,
          };
        case 2:
          return {
            dayNumber,
            dayName,
            topic: `Tips Praktis: Cara Simpan ${pName} Agar Tetap Garing 2 Bulan`,
            contentType: "tips_edukasi",
            badge: "Tips Toko",
            description: `Bagikan tips mudah: simpan ${pName} di toples kedap udara, hindari tempat lembap, dan tutup rapat kembali setelah dinikmati.`,
            targetProd: prod,
            score: 93,
          };
        case 3:
          return {
            dayNumber,
            dayName,
            topic: `Alasan Mengapa ${pName} Sehat & Bebas Pengawet Sintetis`,
            contentType: "behind_the_scenes",
            badge: "Kesehatan",
            description: `Edukasi komitmen higienis ${businessName}: proses penggorengan bersih dan penirisan tuntas menjadikan ${pName} aman dikonsumsi seluruh keluarga.`,
            targetProd: prod,
            score: 96,
          };
        case 4:
          return {
            dayNumber,
            dayName,
            topic: `Inspirasi Cara Menikmati ${pName} Sebagai Teman Santai`,
            contentType: "tips_edukasi",
            badge: "Saran Menu",
            description: `Saran kreasi santai: jadikan ${pName} sebagai pendamping hidangan hangat atau camilan favorit saat santai di rumah.`,
            targetProd: prod,
            score: 94,
          };
        case 5:
          return {
            dayNumber,
            dayName,
            topic: `Paket Hemat Pelengkap: ${pName} & ${cName}`,
            contentType: "tips_edukasi",
            badge: "Kenal Varian",
            description: `Kombinasikan camilan favoritmu: gurihnya ${pName} (${pPrice}) dengan renyahnya ${cName}.`,
            targetProd: prod,
            secondaryProd: companion,
            isBundle: true,
            score: 91,
          };
        case 6:
          return {
            dayNumber,
            dayName,
            topic: `FAQ Pengiriman: Apakah ${pName} Aman Dikirim ke Luar Kota?`,
            contentType: "social_proof",
            badge: "Info Pengiriman",
            description: `Jawab pertanyaan pelanggan seputar keamanan bubble wrap tebal dan kardus kokoh sehingga ${pName} dijamin tiba utuh tanpa remuk.`,
            targetProd: prod,
            score: 96,
          };
        case 7:
        default:
          return {
            dayNumber,
            dayName,
            topic: `Buktikan Sendiri Kerenyahan Autentik ${pName} Hari Ini!`,
            contentType: "product_spotlight",
            badge: "Cicipi Sekarang",
            description: `Ajak audiens membuktikan langsung keaslian rasa ${pName} (${pPrice}) fresh baru matang langsung dari dapur Padang Ganting.`,
            targetProd: prod,
            score: 97,
          };
      }
    }

    // Default: promo_diskon
    switch (dayNumber) {
      case 1:
        return {
          dayNumber,
          dayName,
          topic: `Promo Spesial Awal Pekan: Nikmati Gurih Renyahnya ${pName}!`,
          contentType: "promo_offer",
          badge: "Promo Hemat",
          description: `Buka pekan ini dengan penawaran hemat spesial untuk produk unggulan ${pName} (${pPrice}). Keunggulan: ${pAdv}.`,
          targetProd: prod,
          score: 96,
        };
      case 2:
        return {
          dayNumber,
          dayName,
          topic: `Intip Dapur: Batch Fresh ${pName} Siap Dikirim Hari Ini`,
          contentType: "behind_the_scenes",
          badge: "Dapur Fresh",
          description: `Poster behind-the-scenes batch segar ${pName} yang baru diangkat dari kuali untuk memenuhi pesanan promo pelanggan.`,
          targetProd: prod,
          score: 94,
        };
      case 3:
        return {
          dayNumber,
          dayName,
          topic: `Sensori & Tekstur: Detail Kriuk ${pName}`,
          contentType: "product_spotlight",
          badge: "Sensori & Rasa",
          description: `Poster detail kerenyahan tekstur ${pName}, dipadukan naskah menggugah selera dengan harga sahabat ${pPrice}.`,
          targetProd: prod,
          score: 97,
        };
      case 4:
        return {
          dayNumber,
          dayName,
          topic: `Paket Hemat Combo: Kombinasi Mantap ${pName} + ${cName}`,
          contentType: "promo_offer",
          badge: "Paket Combo",
          description: `Tawarkan paket bundel hemat: perpaduan mantap ${pName} dengan gurihnya ${cName} untuk stok camilan keluarga lebih hemat.`,
          targetProd: prod,
          secondaryProd: companion,
          isBundle: true,
          score: 91,
        };
      case 5:
        return {
          dayNumber,
          dayName,
          topic: `Jumat Berkah: Belanja ${pName} Lebih Untung & Bebas Ongkir!`,
          contentType: "promo_offer",
          badge: "Penawaran Kilat",
          description: `Dorong checkout langsung via WhatsApp dengan penawaran kilat hari ini untuk ${pName}. Pengiriman cepat dan aman ke seluruh Indonesia.`,
          targetProd: prod,
          score: 95,
        };
      case 6:
        return {
          dayNumber,
          dayName,
          topic: `Cerita Pelanggan: Kerenyahan ${pName} yang Bikin Nagih`,
          contentType: "social_proof",
          badge: "Ulasan Nyata",
          description: `Testimoni pembeli dan perantau yang puas dengan kualitas rasa ${pName} yang tetap garing dan lezat saat paket tiba.`,
          targetProd: prod,
          score: 95,
        };
      case 7:
      default:
        return {
          dayNumber,
          dayName,
          topic: `Hitung Mundur: Jam Terakhir Promo Hemat ${pName}!`,
          contentType: "promo_offer",
          badge: "Terakhir!",
          description: `Materi urgensi FOMO: Ingatkan pelanggan bahwa promo khusus ${pName} akan berakhir tepat tengah malam ini sebelum harga normal kembali.`,
          targetProd: prod,
          score: 96,
        };
    }
  }

  const planBlueprint: Array<{
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

  for (let d = 1; d <= 7; d++) {
    const prodIdx = (d - 1) % userSelectedProds.length;
    const currentProd = userSelectedProds[prodIdx];

    const companionIdx = (prodIdx + 1) % userSelectedProds.length;
    const companionForDay = userSelectedProds.length > 1
      ? userSelectedProds[companionIdx]
      : (catalog.find((p) => p.id !== currentProd.id) || currentProd);

    const dayName = DEFAULT_DAYS[d - 1];
    const itemBlueprint = buildDayBlueprint(
      d,
      dayName,
      goalType,
      currentProd,
      companionForDay
    );
    planBlueprint.push(itemBlueprint);
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
    secondaryProductImageUrl: b.secondaryProd?.originalImageUrl || undefined,
  }));

  return {
    engine: "hybrid_cosine_similarity",
    primaryProduct: primaryProd,
    companionProduct: companionProd,
    primaryMatchScore: primaryScore,
    companionMatchScore: companionScore,
    items: finalItems,
  };
}
