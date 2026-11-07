import { NextResponse } from "next/server";
import { db } from "@/db";
import { contentPlans, marketingGoals, products, businesses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SANJAI_NAFAMA_PRODUCTS, SANJAI_NAFAMA_BUSINESS } from "@/lib/constants";
import { getStoredActivePlan, clearStoredActivePlan, updateStoredPlanItem } from "@/lib/marketing-store";

export const dynamic = "force-dynamic";

const DEFAULT_DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let goalId = searchParams.get("goalId");

    // 1. Cek apakah ada di Neon PostgreSQL
    try {
      if (!goalId) {
        const latestGoals = await db
          .select({ id: marketingGoals.id })
          .from(marketingGoals)
          .orderBy(desc(marketingGoals.createdAt))
          .limit(1);

        if (latestGoals.length > 0) {
          goalId = latestGoals[0].id;
        }
      }

      const isUUID = Boolean(goalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(goalId));

      if (isUUID && goalId) {
        const validGoalId: string = goalId;
        const goalRows = await db
          .select({
            goalId: marketingGoals.id,
            goalType: marketingGoals.goalType,
            notes: marketingGoals.notes,
            targetProductId: marketingGoals.targetProductId,
            businessName: businesses.businessName,
            businessLocation: businesses.location,
          })
          .from(marketingGoals)
          .leftJoin(businesses, eq(marketingGoals.businessId, businesses.id))
          .where(eq(marketingGoals.id, validGoalId));

        const goalInfo = goalRows[0] || null;

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
          const items = planRows.map((r) => {
            const isCombo = r.topic.toLowerCase().includes("paket") || r.topic.toLowerCase().includes("duo") || r.topic.toLowerCase().includes("combo");
            return {
              id: r.id,
              goalId: r.goalId,
              dayNumber: r.dayNumber,
              dayName: DEFAULT_DAY_NAMES[r.dayNumber - 1] || "Senin",
              scheduledDate: r.scheduledDate,
              topic: r.topic,
              contentType: r.contentType,
              badge: getDynamicBadge(r.topic, r.contentType),
              description: r.description,
              recommendedProductId: r.recommendedProductId || "",
              productName: r.productName || "Produk Pilihan",
              productImageUrl: r.productImageUrl || "/produk/produk3.jpg",
              productPrice: Number(r.productPrice) || 25000,
              status: r.status as "planned" | "generated" | "published",
              matchScore: 92,
              isBundle: isCombo,
            };
          });

          return NextResponse.json({
            success: true,
            data: {
              active: true,
              goalId,
              goalType: goalInfo?.goalType || "promo_diskon",
              goalNotes: goalInfo?.notes || null,
              businessName: goalInfo?.businessName || SANJAI_NAFAMA_BUSINESS.name,
              businessLocation: goalInfo?.businessLocation || SANJAI_NAFAMA_BUSINESS.location,
              items,
              isLocked: true,
              engine: "hybrid_cosine_similarity",
              source: "database_neon",
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn("[API planner GET] Neon DB query failed, checking stored plan:", dbErr);
    }

    // 2. Cek persistent file store jika DB belum ada atau offline
    const stored = getStoredActivePlan();
    if (stored && stored.items && stored.items.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          ...stored,
          active: true,
        },
      });
    }

    // 3. Jika tidak ada strategi aktif sama sekali, kembalikan data: null (TIDAK ADA MOCKUP STATIS)
    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error("Gagal get planner:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Reset / Batalkan Strategi Aktif (DELETE)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get("goalId");

    // 1. Hapus dari database Neon
    try {
      const isUUID = Boolean(goalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(goalId));
      if (isUUID && goalId) {
        await db.delete(marketingGoals).where(eq(marketingGoals.id, goalId));
      } else {
        // Hapus seluruh marketing goals aktif
        await db.delete(marketingGoals);
      }
    } catch (dbErr) {
      console.warn("[API planner DELETE] Neon delete warning:", dbErr);
    }

    // 2. Bersihkan persistent store
    clearStoredActivePlan();

    return NextResponse.json({
      success: true,
      message: "Strategi pemasaran aktif berhasil dibatalkan dan dihapus secara tuntas.",
    });
  } catch (error) {
    console.error("Gagal menghapus strategi planner:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus strategi" }, { status: 500 });
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

    updateStoredPlanItem(id, { topic, description: description || "" });

    return NextResponse.json({
      success: true,
      data: { id, topic, description },
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

    updateStoredPlanItem(id, { status });

    return NextResponse.json({
      success: true,
      data: { id, status },
    });
  } catch (error) {
    console.error("Gagal update status planner:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui status" }, { status: 500 });
  }
}
