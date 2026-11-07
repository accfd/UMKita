import { NextResponse } from "next/server";
import { db } from "@/db";
import { contentPlans, marketingGoals, products, businesses, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateHybridMarketingPlan, CatalogProduct } from "@/lib/recommender/engine";
import { SANJAI_NAFAMA_PRODUCTS, SANJAI_NAFAMA_BUSINESS } from "@/lib/constants";
import { getPersistentProducts } from "@/lib/products-store";
import { setStoredActivePlan } from "@/lib/marketing-store";

function getScheduledDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

const DEFAULT_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function isUUID(val?: string | null): boolean {
  return Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
}

async function getOrCreateBusiness(): Promise<{ id: string; name: string; location: string }> {
  try {
    const bizRows = await db.select().from(businesses).limit(1);
    if (bizRows.length > 0) {
      return {
        id: bizRows[0].id,
        name: bizRows[0].businessName || SANJAI_NAFAMA_BUSINESS.name,
        location: bizRows[0].location || SANJAI_NAFAMA_BUSINESS.location,
      };
    }

    // Buat user dummy jika belum ada
    let userId: string;
    const userRows = await db.select({ id: users.id }).from(users).limit(1);
    if (userRows.length > 0) {
      userId = userRows[0].id;
    } else {
      const [newUser] = await db.insert(users).values({
        email: "owner@sanjainafama.com",
        passwordHash: "dummy-password-hash",
        fullName: "Pemilik Sanjai Nafama",
      }).returning({ id: users.id });
      userId = newUser.id;
    }

    const [newBiz] = await db.insert(businesses).values({
      userId,
      businessName: SANJAI_NAFAMA_BUSINESS.name,
      category: "kuliner",
      subCategory: "Oleh-oleh Khas Minangkabau",
      description: SANJAI_NAFAMA_BUSINESS.bio || "Oleh-oleh Khas Minangkabau Asli",
      location: SANJAI_NAFAMA_BUSINESS.location,
      targetAudience: "Wisatawan & Perantau Minang",
    }).returning();

    return {
      id: newBiz.id,
      name: newBiz.businessName,
      location: newBiz.location,
    };
  } catch (err) {
    console.warn("getOrCreateBusiness fallback:", err);
    return {
      id: "00000000-0000-0000-0000-000000000001",
      name: SANJAI_NAFAMA_BUSINESS.name,
      location: SANJAI_NAFAMA_BUSINESS.location,
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const goalType = (body.goalType || "promo_diskon") as string;
    let selectedProductId = body.productId;
    const selectedProductIds: string[] = Array.isArray(body.productIds)
      ? body.productIds
      : (selectedProductId ? [selectedProductId] : []);
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    // 1. Ambil data produk riil dari Database Neon
    let dbProds: any[] = [];
    try {
      dbProds = await db.select().from(products);
    } catch (e) {
      console.warn("DB select products notice:", e);
    }

    const catalog: CatalogProduct[] = dbProds.length > 0
      ? dbProds.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price) || 25000,
          description: p.description,
          advantages: p.advantages,
          originalImageUrl: p.originalImageUrl,
        }))
      : getPersistentProducts().map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          description: p.description,
          advantages: p.advantages,
          originalImageUrl: p.originalImageUrl,
        }));

    if (!selectedProductId && catalog.length > 0) {
      selectedProductId = catalog[0].id;
    }

    // 2. Dapatkan info Bisnis
    const biz = await getOrCreateBusiness();

    // 3. Eksekusi Engine Rekomendasi (Cosine Similarity + Funnel)
    const recommendation = generateHybridMarketingPlan({
      businessName: biz.name,
      businessLocation: biz.location,
      goalType,
      notes,
      selectedProductId,
      selectedProductIds,
      catalog,
    });

    const dates = getScheduledDates();

    // 4. KUNCI DATA: Simpan langsung sasaran baru ke tabel marketing_goals di Neon DB
    let activeGoalId = `goal-${Date.now()}`;
    let savedToDb = false;

    try {
      // Hapus strategi lama agar tabel tetap bersih (single active strategy)
      await db.delete(marketingGoals);

      const [newGoal] = await db.insert(marketingGoals).values({
        businessId: biz.id,
        goalType,
        targetProductId: isUUID(selectedProductId) ? selectedProductId : null,
        notes: notes || null,
      }).returning();

      if (newGoal?.id) {
        activeGoalId = newGoal.id;
        savedToDb = true;
      }
    } catch (goalInsertErr) {
      console.warn("Gagal insert marketing_goal ke Neon:", goalInsertErr);
    }

    // 5. Simpan 7 Jadwal Konten Terarah ke content_plans di Neon DB
    const planItems = [];

    for (let idx = 0; idx < recommendation.items.length; idx++) {
      const item = recommendation.items[idx];
      let insertedId = `plan-day-${item.dayNumber}-${Date.now()}`;

      if (savedToDb && isUUID(activeGoalId)) {
        try {
          const [inserted] = await db.insert(contentPlans).values({
            goalId: activeGoalId,
            dayNumber: item.dayNumber,
            scheduledDate: dates[idx],
            topic: item.topic,
            contentType: item.contentType,
            description: item.description,
            recommendedProductId: isUUID(item.recommendedProductId) ? item.recommendedProductId : null,
            status: idx === 0 ? "generated" : "planned",
          }).returning();

          if (inserted?.id) {
            insertedId = inserted.id;
          }
        } catch (planInsertErr) {
          console.warn(`Gagal insert content_plan day ${item.dayNumber} ke DB:`, planInsertErr);
        }
      }

      planItems.push({
        id: insertedId,
        goalId: activeGoalId,
        dayNumber: item.dayNumber,
        dayName: item.dayName,
        scheduledDate: dates[idx],
        topic: item.topic,
        contentType: item.contentType,
        badge: item.badge,
        description: item.description,
        recommendedProductId: item.recommendedProductId,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        productPrice: item.productPrice,
        status: (idx === 0 ? "generated" : "planned") as "planned" | "generated" | "published",
        matchScore: item.matchScore,
        isBundle: item.isBundle,
        secondaryProductId: item.secondaryProductId,
        secondaryProductName: item.secondaryProductName,
        secondaryProductPrice: item.secondaryProductPrice,
        secondaryProductImageUrl: item.secondaryProductImageUrl,
      });
    }

    // 6. Simpan juga ke stored active plan agar aman dari cold start
    const resultData = {
      goalId: activeGoalId,
      goalType,
      goalNotes: notes || null,
      businessName: biz.name,
      businessLocation: biz.location,
      totalItems: planItems.length,
      items: planItems,
      isLocked: true,
      primaryMatchScore: recommendation.primaryMatchScore,
      companionMatchScore: recommendation.companionMatchScore,
      engine: "hybrid_cosine_similarity" as const,
      createdAt: new Date().toISOString(),
      source: savedToDb ? "database_neon" : "persistent_store",
    };

    setStoredActivePlan(resultData);

    return NextResponse.json({
      success: true,
      data: resultData,
    }, { status: 201 });

  } catch (error) {
    console.error("Gagal generate strategi di planner/generate:", error);
    return NextResponse.json({
      success: false,
      error: {
        code: "GENERATION_ERROR",
        message: "Gagal membuat jadwal konten mingguan. Silakan coba kembali.",
      },
    }, { status: 500 });
  }
}
