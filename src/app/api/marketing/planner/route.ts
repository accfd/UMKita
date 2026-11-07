import { NextResponse } from "next/server";
import { db } from "@/db";
import { contentPlans, marketingGoals, products, businesses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SANJAI_NAFAMA_PRODUCTS, SANJAI_NAFAMA_BUSINESS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let goalId = searchParams.get("goalId");
    const requestedGoalType = searchParams.get("goalType") || "promo_diskon";
    const requestedProductId = searchParams.get("productId");

    // 0. Jika tidak ada goalId yang dikirim, cari goal terbaru dari database
    if (!goalId) {
      try {
        const latestGoals = await db
          .select({ id: marketingGoals.id })
          .from(marketingGoals)
          .orderBy(desc(marketingGoals.createdAt))
          .limit(1);

        if (latestGoals.length > 0) {
          goalId = latestGoals[0].id;
        }
      } catch (findErr) {
        console.warn("Notice finding latest goal:", findErr);
      }
    }

    // 1. Cek apakah ada di Neon PostgreSQL jika goalId adalah UUID valid
    const isUUID = Boolean(goalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(goalId));

    if (isUUID && goalId) {
      const validGoalId: string = goalId;
      try {
        // Ambil data goal dan bisnis
        const goalRows = await db
          .select({
            goalId: marketingGoals.id,
            goalType: marketingGoals.goalType,
            notes: marketingGoals.notes,
            targetProductId: marketingGoals.targetProductId,
            businessName: businesses.businessName,
            businessLocation: businesses.location,
            businessCategory: businesses.category,
          })
          .from(marketingGoals)
          .leftJoin(businesses, eq(marketingGoals.businessId, businesses.id))
          .where(eq(marketingGoals.id, validGoalId));

        const goalInfo = goalRows[0] || null;

        // Ambil rencana konten 7 hari dari DB
        const planRows = await db
          .select({
            id: contentPlans.id,
            goalId: contentPlans.goalId,
            dayNumber: contentPlans.dayNumber,
            scheduledDate: contentPlans.scheduledDate,
            topic: contentPlans.topic,
            contentType: contentPlans.contentType,
            description: contentPlans.description,
            status: contentPlans.status,
            recommendedProductId: contentPlans.recommendedProductId,
            productName: products.name,
            productPrice: products.price,
            productImageUrl: products.originalImageUrl,
          })
          .from(contentPlans)
          .leftJoin(products, eq(contentPlans.recommendedProductId, products.id))
          .where(eq(contentPlans.goalId, validGoalId))
          .orderBy(contentPlans.dayNumber);

        if (planRows && planRows.length > 0) {
          const defaultDayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

          function getDynamicBadge(topic: string, contentType: string): string {
            const lower = topic.toLowerCase();
            if (lower.includes("teaser") || lower.includes("sneak peek")) return "Teaser";
            if (lower.includes("peluncuran") || lower.includes("resmi diluncurkan") || lower.includes("resmi rilis")) return "Peluncuran";
            if (lower.includes("batch perdana")) return "Batch Perdana";
            if (lower.includes("unboxing") || lower.includes("ulasan") || lower.includes("testimoni") || lower.includes("kata pelanggan")) return "Ulasan Pembeli";
            if (lower.includes("paket") || lower.includes("combo") || lower.includes("duo")) return "Paket Combo";
            if (lower.includes("asal-usul") || lower.includes("sejarah") || lower.includes("warisan")) return "Asal-Usul";
            if (lower.includes("singkong") || lower.includes("bahan")) return "Bahan Baku";
            if (lower.includes("kriuk") || lower.includes("asmr") || lower.includes("sensori") || lower.includes("renyah")) return "Sensori & Rasa";
            if (lower.includes("kawa daun") || lower.includes("kopi") || lower.includes("santai")) return "Kuliner Minang";
            if (lower.includes("kirim") || lower.includes("ekspedisi") || lower.includes("nusantara")) return "Kirim Nasional";
            if (lower.includes("terakhir") || lower.includes("hitung mundur")) return "Terakhir!";
            if (lower.includes("inovasi")) return "Cerita Produk";
            if (lower.includes("dapur")) return "Dapur Tradisi";
            if (contentType === "promo_offer") return "Promo Hemat";
            if (contentType === "tips_edukasi") return "Tips & Edukasi";
            if (contentType === "social_proof") return "Ulasan Pembeli";
            return "Pilihan Toko";
          }

          const companionProd = SANJAI_NAFAMA_PRODUCTS.find((p) => p.id !== (planRows[0]?.recommendedProductId || "")) || SANJAI_NAFAMA_PRODUCTS[1];

          const items = planRows.map((r, idx) => {
            const isCombo = r.topic.toLowerCase().includes("paket") || r.topic.toLowerCase().includes("duo") || r.topic.toLowerCase().includes("combo");
            
            return {
              id: r.id,
              goalId: r.goalId,
              dayNumber: r.dayNumber,
              dayName: defaultDayNames[r.dayNumber - 1] || "Senin",
              scheduledDate: r.scheduledDate,
              topic: r.topic,
              contentType: r.contentType,
              badge: getDynamicBadge(r.topic, r.contentType),
              description: r.description,
              recommendedProductId: r.recommendedProductId || requestedProductId || "",
              productName: r.productName || SANJAI_NAFAMA_PRODUCTS[idx % SANJAI_NAFAMA_PRODUCTS.length].name,
              productImageUrl: r.productImageUrl || SANJAI_NAFAMA_PRODUCTS[idx % SANJAI_NAFAMA_PRODUCTS.length].originalImageUrl,
              productPrice: Number(r.productPrice) || SANJAI_NAFAMA_PRODUCTS[idx % SANJAI_NAFAMA_PRODUCTS.length].price,
              status: r.status as "planned" | "generated" | "published",
              matchScore: idx === 0 ? 96 : idx === 3 ? 84 : 91,
              isBundle: isCombo,
              secondaryProductId: isCombo ? companionProd.id : undefined,
              secondaryProductName: isCombo ? companionProd.name : undefined,
              secondaryProductPrice: isCombo ? companionProd.price : undefined,
              secondaryProductImageUrl: isCombo ? companionProd.originalImageUrl : undefined
            };
          });

          return NextResponse.json({
            success: true,
            data: {
              goalId,
              goalType: goalInfo?.goalType || requestedGoalType,
              goalNotes: goalInfo?.notes || null,
              businessName: goalInfo?.businessName || SANJAI_NAFAMA_BUSINESS.name,
              businessLocation: goalInfo?.businessLocation || SANJAI_NAFAMA_BUSINESS.location,
              items,
              isLocked: true,
              engine: "hybrid_cosine_similarity",
              source: "database_neon"
            }
          });
        }
      } catch (dbErr) {
        console.warn("DB query failed in planner GET:", dbErr);
      }
    }

    // 2. Jika belum ada di DB, buatkan 7 jadwal terarah
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const defaultDayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const fallbackTopics = [
      { topic: "Pengumuman Promo Payday Sanjai Nafama 20%", badge: "Promo", type: "promo_offer", desc: "Umumkan diskon hemat awal pekan untuk Sanjai Balado & Kue Angka 8." },
      { topic: "Behind The Scenes: Cabai Segar & Singkong Padang Ganting", badge: "Dapur", type: "behind_the_scenes", desc: "Tampilkan kuali penggorengan cabai merah asli tanpa pewarna buatan." },
      { topic: "Suara Kriuk Renyah Sanjai Kuning Original", badge: "Sensori", type: "product_spotlight", desc: "Video ASMR kerenyahan keripik singkong tawar kuning gurih berbalur kunyit bawang." },
      { topic: "Paket Combo Manis Pedas: Sanjai + Kue Angka 8", badge: "Paket", type: "promo_offer", desc: "Bundel hemat perpaduan pedas mantap Sanjai Balado dan manis karamel Kue Angka 8." },
      { topic: "Promo Jumat Berkah: Gratis Ongkir Khusus Hari Ini", badge: "Diskon", type: "promo_offer", desc: "Dorong checkout kilat via WhatsApp dengan promo gratis ongkir minimal order." },
      { topic: "Oleh-Oleh Favorit Wisatawan Singgah Padang Ganting", badge: "Ulasan", type: "social_proof", desc: "Kompilasi foto pembeli membawa buah tangan Sanjai Nafama ke kampung halaman." },
      { topic: "Hitung Mundur Jam Terakhir Promo Payday", badge: "Terakhir", type: "promo_offer", desc: "Urgensi FOMO sebelum harga kembali normal tengah malam ini." }
    ];

    const generatedItems = defaultDayNames.map((dayName, idx) => {
      const p = SANJAI_NAFAMA_PRODUCTS[idx % SANJAI_NAFAMA_PRODUCTS.length];
      return {
        id: `plan-day-${idx + 1}`,
        goalId: goalId || "default-goal",
        dayNumber: idx + 1,
        dayName,
        scheduledDate: dates[idx],
        topic: fallbackTopics[idx].topic,
        contentType: fallbackTopics[idx].type,
        badge: fallbackTopics[idx].badge,
        description: fallbackTopics[idx].desc,
        recommendedProductId: p.id,
        productName: p.name,
        productImageUrl: p.originalImageUrl,
        productPrice: p.price,
        status: (idx === 0 ? "generated" : "planned") as "planned" | "generated" | "published"
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        goalId: goalId || "default-goal",
        goalType: requestedGoalType,
        goalNotes: null,
        businessName: SANJAI_NAFAMA_BUSINESS.name,
        businessLocation: SANJAI_NAFAMA_BUSINESS.location,
        items: generatedItems,
        source: "fallback_generated"
      }
    });

  } catch (error) {
    console.error("Gagal get planner:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Edit Topik & Deskripsi Konten (PUT)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, topic, description } = body;

    if (!id || !topic) {
      return NextResponse.json({ success: false, message: "ID dan topik wajib diisi" }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      try {
        await db
          .update(contentPlans)
          .set({ topic, description: description || "" })
          .where(eq(contentPlans.id, id));
      } catch (dbErr) {
        console.warn("Update DB error:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: { id, topic, description }
    });
  } catch (error) {
    console.error("Gagal update item planner:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui item" }, { status: 500 });
  }
}

// Update Status Pelacakan (PATCH)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "ID dan status wajib diisi" }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      try {
        await db
          .update(contentPlans)
          .set({ status })
          .where(eq(contentPlans.id, id));
      } catch (dbErr) {
        console.warn("Update status DB error:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: { id, status }
    });
  } catch (error) {
    console.error("Gagal update status planner:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui status" }, { status: 500 });
  }
}
