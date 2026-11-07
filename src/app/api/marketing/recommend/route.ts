import { NextResponse } from "next/server";
import { db } from "@/db";
import { marketingGoals, businesses, users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RecommendRequest {
  goalType: "promo_diskon" | "product_launch" | "brand_awareness" | "edukasi_pelanggan";
  targetProductId?: string;
  notes?: string;
}

// Rekomendasi Cerdas Khusus Akun Riil: Sanjai Nafama (@sanjainafama_padang.ganting)
const GOAL_RULES = {
  promo_diskon: {
    title: "Flash Sale Payday Sanjai Nafama — Khas Padang Ganting",
    keyMessage: "Renyahnya Sanjai Balado & Kue Angka Delapan asli olahan Padang Ganting dengan harga hemat spesial minggu ini!",
    hashtags: ["#SanjaiNafama", "#PadangGanting", "#TanahDatar", "#SanjaiBalado", "#DiskonKuliner", "#UMKita"],
    suggestedFormat: "POSTER",
    recommendedPreset: "bold_promo",
    contentSplit: { promo: 60, storytelling: 25, edukasi: 15 },
    daysPreview: [
      { day: "Senin", topic: "Pengumuman Promo Hemat 20% Sanjai Nafama", badge: "Promo", type: "promo_offer" },
      { day: "Selasa", topic: "Bocoran Singkong Segar & Cabai Asli Padang Ganting", badge: "Kualitas", type: "behind_the_scenes" },
      { day: "Rabu", topic: "Ulasan Pembeli: Manis Pedasnya Bikin Nagih", badge: "Review", type: "social_proof" },
      { day: "Kamis", topic: "Paket Combo: Sanjai Balado + Kue Angka 8", badge: "Paket", type: "tips_edukasi" },
      { day: "Jumat", topic: "Flash Sale Jumat Berkah Pengiriman Kilat", badge: "Diskon", type: "promo_offer" },
      { day: "Sabtu", topic: "Stok Siap Kirim untuk Wisatawan & Perantau", badge: "Order", type: "product_spotlight" },
      { day: "Minggu", topic: "Hari Terakhir Promo Payday Sanjai Nafama", badge: "Urgent", type: "promo_offer" }
    ]
  },
  product_launch: {
    title: "Peluncuran Kemasan Baru Sanjai Nafama Praktis",
    keyMessage: "Hadir dengan kemasan pouch kedap udara baru, menjaga kerenyahan khas olahan tangan Padang Ganting lebih awet!",
    hashtags: ["#SanjaiNafama", "#KemasanBaru", "#PadangGanting", "#OlehOlehMinang", "#KulinerViral", "#UMKita"],
    suggestedFormat: "POSTER",
    recommendedPreset: "claymorphism",
    contentSplit: { promo: 30, storytelling: 50, edukasi: 20 },
    daysPreview: [
      { day: "Senin", topic: "Sneak Peek: Inovasi Kemasan Sanjai Nafama", badge: "Teaser", type: "behind_the_scenes" },
      { day: "Selasa", topic: "Cerita Tradisi Menggoreng Sanjai Sejak Dulu", badge: "Cerita", type: "behind_the_scenes" },
      { day: "Rabu", topic: "Resmi Diluncurkan: Lebih Higienis & Awet", badge: "Launch", type: "product_spotlight" },
      { day: "Kamis", topic: "Dapur Produksi Padang Ganting Beraksi", badge: "Dapur", type: "behind_the_scenes" },
      { day: "Jumat", topic: "Harga Perkenalan Spesial Khusus Follower IG", badge: "Spesial", type: "promo_offer" },
      { day: "Sabtu", topic: "Unboxing Kerenyahan Sanjai Nafama", badge: "Review", type: "social_proof" },
      { day: "Minggu", topic: "Siap Dikirim ke Seluruh Nusantara", badge: "Info", type: "product_spotlight" }
    ]
  },
  brand_awareness: {
    title: "Mengenal Usaha Rumahan Sanjai Nafama Tanah Datar",
    keyMessage: "Dari Nagari Padang Ganting Kabupaten Tanah Datar, menghadirkan cita rasa keripik singkong warisan keluarga yang otentik.",
    hashtags: ["#SanjaiNafama", "#WisataTanahDatar", "#PadangGanting", "#CamilanMinang", "#BudayaMinang", "#UMKita"],
    suggestedFormat: "POSTER",
    recommendedPreset: "rustic_minang",
    contentSplit: { promo: 20, storytelling: 60, edukasi: 20 },
    daysPreview: [
      { day: "Senin", topic: "Perjalanan Usaha Sanjai Nafama Padang Ganting", badge: "Sejarah", type: "behind_the_scenes" },
      { day: "Selasa", topic: "Kenapa Singkong Lokal Tanah Datar Lebih Gurih?", badge: "Bahan", type: "tips_edukasi" },
      { day: "Rabu", topic: "Spotlight Menu: Kue Angka 8 Karamel Manis", badge: "Tradisi", type: "product_spotlight" },
      { day: "Kamis", topic: "Oleh-Oleh Wajib Singgah Padang Ganting", badge: "Favorit", type: "social_proof" },
      { day: "Jumat", topic: "Dedikasi Menjaga Resep Asli Minangkabau", badge: "Komitmen", type: "behind_the_scenes" },
      { day: "Sabtu", topic: "Pilihan Buah Tangan Terbaik untuk Kerabat", badge: "Hampers", type: "product_spotlight" },
      { day: "Minggu", topic: "Terima Kasih Pelanggan Setia Sanjai Nafama", badge: "Apresiasi", type: "social_proof" }
    ]
  },
  edukasi_pelanggan: {
    title: "Edukasi Rasa: Bedanya Sanjai Asli Padang Ganting",
    keyMessage: "Rahasia bumbu balado meresap sempurna tanpa bahan kimia dan tips menyimpan agar tetap renyah berminggu-minggu.",
    hashtags: ["#TipsSanjai", "#SanjaiNafama", "#PadangGanting", "#KueAngkaDelapan", "#KulinerOtentik", "#UMKita"],
    suggestedFormat: "POSTER",
    recommendedPreset: "editorial_magazine",
    contentSplit: { promo: 15, storytelling: 35, edukasi: 50 },
    daysPreview: [
      { day: "Senin", topic: "Ciri-Ciri Keripik Sanjai Balado Alami", badge: "Kualitas", type: "tips_edukasi" },
      { day: "Selasa", topic: "Tips Menyimpan Keripik agar Tetap Renyah Kriuk", badge: "Tips Awet", type: "tips_edukasi" },
      { day: "Rabu", topic: "Kombinasi Nikmat: Sanjai Nafama & Kopi Hitam", badge: "Saran Saji", type: "tips_edukasi" },
      { day: "Kamis", topic: "Mengenal Sejarah Kue Angka Delapan Minang", badge: "Budaya", type: "tips_edukasi" },
      { day: "Jumat", topic: "Tanya Jawab Seputar Pengiriman Luar Kota", badge: "Q&A", type: "social_proof" },
      { day: "Sabtu", topic: "Perbedaan Sanjai Kuning vs Sanjai Balado", badge: "Perbandingan", type: "product_spotlight" },
      { day: "Minggu", topic: "Kuis Tebak Bumbu Berhadiah Sanjai Nafama", badge: "Kuis", type: "promo_offer" }
    ]
  }
};

export async function POST(req: Request) {
  try {
    const body: RecommendRequest = await req.json();
    const { goalType, targetProductId, notes } = body;

    const rule = GOAL_RULES[goalType] || GOAL_RULES.promo_diskon;

    let savedGoalId = `goal-${Date.now()}`;
    try {
      let existingBusinesses = await db.select().from(businesses).where(eq(businesses.businessName, "Sanjai Nafama")).limit(1);
      if (existingBusinesses.length === 0) {
        existingBusinesses = await db.select().from(businesses).limit(1);
      }
      let businessId = existingBusinesses[0]?.id;

      if (!businessId) {
        const [newUser] = await db.insert(users).values({
          email: "sanjainafama@umkita.id",
          passwordHash: "hash-nafama",
          fullName: "Owner Sanjai Nafama",
        }).returning();

        const [newBiz] = await db.insert(businesses).values({
          userId: newUser.id,
          businessName: "Sanjai Nafama",
          category: "kuliner",
          subCategory: "Oleh-Oleh Khas Padang Ganting",
          description: "Produsen keripik singkong sanjai balado, original, dan kue angka delapan khas Padang Ganting, Tanah Datar.",
          location: "Padang Ganting, Kabupaten Tanah Datar, Sumatera Barat",
          targetAudience: "Wisatawan, perantau Minang, dan penikmat camilan pedas manis",
        }).returning();

        businessId = newBiz.id;
      }

      const isUUID = targetProductId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetProductId);

      const [newGoal] = await db.insert(marketingGoals).values({
        businessId: businessId,
        goalType: goalType,
        targetProductId: isUUID ? targetProductId : null,
        notes: notes || null,
      }).returning();

      if (newGoal?.id) {
        savedGoalId = newGoal.id;
      }
    } catch (dbErr) {
      console.warn("DB notice (fallback in-memory):", dbErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        goalId: savedGoalId,
        goalType,
        businessName: "Sanjai Nafama",
        handle: "@sanjainafama_padang.ganting",
        campaignTitle: rule.title,
        keyMessage: notes ? `${rule.keyMessage} (Catatan Khusus: ${notes})` : rule.keyMessage,
        hashtags: rule.hashtags,
        suggestedFormat: rule.suggestedFormat,
        recommendedPreset: rule.recommendedPreset,
        contentSplit: rule.contentSplit,
        daysPreview: rule.daysPreview
      }
    });
  } catch (error) {
    console.error("Gagal memproses rekomendasi:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menyusun rekomendasi strategi pemasaran. Silakan coba kembali."
        }
      },
      { status: 500 }
    );
  }
}
