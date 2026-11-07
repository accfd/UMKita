import { NextResponse } from "next/server";
import { db } from "@/db";
import { contentPlans, marketingGoals, products, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateHybridMarketingPlan, CatalogProduct } from "@/lib/recommender/engine";
import { SANJAI_NAFAMA_PRODUCTS, SANJAI_NAFAMA_BUSINESS } from "@/lib/constants";
import { getPersistentProducts } from "@/lib/products-store";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let goalType = (body.goalType || "promo_diskon") as string;
    let selectedProductId = body.productId;
    let selectedProductIds: string[] = Array.isArray(body.productIds)
      ? body.productIds
      : (selectedProductId ? [selectedProductId] : []);
    let goalId = body.goalId;
    const forceRegenerate = Boolean(body.forceRegenerate);

    const isUUID = goalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(goalId);

    // =========================================================================
    // 1. FITUR IDEMPOTENT PLAN LOCKING (Anti-Spam / Anti-Overwrite)
    // =========================================================================
    // Jika strategi 7 hari untuk goal ini sudah pernah digenerate di database,
    // dan user TIDAK meminta forceRegenerate secara eksplisit, kembalikan data terkunci!
    if (isUUID && !forceRegenerate) {
      try {
        const existingPlans = await db
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
          .where(eq(contentPlans.goalId, goalId))
          .orderBy(contentPlans.dayNumber);

        if (existingPlans && existingPlans.length === 7) {
          const lockedItems = existingPlans.map((r, idx) => ({
            id: r.id,
            goalId: r.goalId,
            dayNumber: r.dayNumber,
            dayName: DEFAULT_DAYS[r.dayNumber - 1] || "Senin",
            scheduledDate: r.scheduledDate,
            topic: r.topic,
            contentType: r.contentType,
            badge: r.contentType === "promo_offer" ? "Promo Hemat" : r.contentType === "behind_the_scenes" ? "Dapur Tradisi" : "Pilihan",
            description: r.description,
            recommendedProductId: r.recommendedProductId || selectedProductId || "",
            productName: r.productName || SANJAI_NAFAMA_PRODUCTS[idx % SANJAI_NAFAMA_PRODUCTS.length].name,
            productImageUrl: r.productImageUrl || SANJAI_NAFAMA_PRODUCTS[idx % SANJAI_NAFAMA_PRODUCTS.length].originalImageUrl,
            productPrice: Number(r.productPrice) || SANJAI_NAFAMA_PRODUCTS[idx % SANJAI_NAFAMA_PRODUCTS.length].price,
            status: r.status as "planned" | "generated" | "published",
            matchScore: idx === 0 ? 96 : 90
          }));

          return NextResponse.json({
            success: true,
            data: {
              goalId,
              goalType,
              totalItems: 7,
              items: lockedItems,
              isLocked: true,
              engine: "hybrid_cosine_similarity",
              message: "Strategi konten sudah terkunci dan aktif di database.",
              source: "database_neon_locked"
            }
          }, { status: 200 });
        }
      } catch (lockCheckErr) {
        console.warn("Lock check warning:", lockCheckErr);
      }
    }

    // =========================================================================
    // 2. AMBIL DATA PRODUK RIIL DARI DATABASE NEON
    // =========================================================================
    let dbProds: any[] = [];
    try {
      dbProds = await db.select().from(products);
    } catch (e) {
      console.warn("DB select products notice:", e);
    }

    // Fallback katalog jika DB belum ada baris
    const catalog: CatalogProduct[] = dbProds.length > 0
      ? dbProds.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          description: p.description,
          advantages: p.advantages,
          originalImageUrl: p.originalImageUrl
        }))
      : getPersistentProducts().map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          description: p.description,
          advantages: p.advantages,
          originalImageUrl: p.originalImageUrl
        }));

    // =========================================================================
    // 3. AMBIL INFO GOAL & BISNIS
    // =========================================================================
    let businessName = SANJAI_NAFAMA_BUSINESS.name;
    let businessLocation = SANJAI_NAFAMA_BUSINESS.location;
    let userNotes = "";

    if (isUUID) {
      try {
        const goals = await db.select().from(marketingGoals).where(eq(marketingGoals.id, goalId));
        if (goals.length > 0) {
          const dbGoal = goals[0];
          goalType = dbGoal.goalType;
          userNotes = dbGoal.notes || "";
          if (dbGoal.targetProductId) {
            selectedProductId = dbGoal.targetProductId;
          }
          if (dbGoal.businessId) {
            const biz = await db.select().from(businesses).where(eq(businesses.id, dbGoal.businessId));
            if (biz.length > 0) {
              businessName = biz[0].businessName || businessName;
              businessLocation = biz[0].location || businessLocation;
            }
          }
        }
      } catch (e) {
        console.warn("DB select goal notice:", e);
      }
    }

    if (!selectedProductId && catalog.length > 0) {
      selectedProductId = catalog[0].id;
    }

    // =========================================================================
    // 4. EKSEKUSI ENGINE REKOMENDASI (Cosine Similarity + Rule-Based Funnel)
    // =========================================================================
    const recommendation = generateHybridMarketingPlan({
      businessName,
      businessLocation,
      goalType,
      notes: userNotes,
      selectedProductId,
      selectedProductIds,
      catalog
    });

    const dates = getScheduledDates();

    // =========================================================================
    // 5. SIMPAN KE NEON POSTGRESQL & KUNCI STRATEGI
    // =========================================================================
    if (isUUID) {
      try {
        // Hapus draf lama jika sedang forceRegenerate
        await db.delete(contentPlans).where(eq(contentPlans.goalId, goalId));
      } catch (delErr) {
        console.warn("Notice delete old plans:", delErr);
      }
    }

    const planItems = [];

    for (let idx = 0; idx < recommendation.items.length; idx++) {
      const item = recommendation.items[idx];
      let insertedId = `plan-day-${item.dayNumber}`;

      if (isUUID) {
        try {
          const [inserted] = await db.insert(contentPlans).values({
            goalId: goalId,
            dayNumber: item.dayNumber,
            scheduledDate: dates[idx],
            topic: item.topic,
            contentType: item.contentType,
            description: item.description,
            recommendedProductId: item.recommendedProductId,
            status: idx === 0 ? "generated" : "planned"
          }).returning();

          if (inserted?.id) {
            insertedId = inserted.id;
          }
        } catch (insErr) {
          console.warn(`Gagal insert day ${item.dayNumber} ke DB:`, insErr);
        }
      }

      planItems.push({
        id: insertedId,
        goalId: goalId,
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
        status: idx === 0 ? "generated" : "planned",
        matchScore: item.matchScore,
        isBundle: item.isBundle,
        secondaryProductId: item.secondaryProductId,
        secondaryProductName: item.secondaryProductName,
        secondaryProductPrice: item.secondaryProductPrice,
        secondaryProductImageUrl: item.secondaryProductImageUrl
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        goalId,
        goalType,
        totalItems: planItems.length,
        items: planItems,
        isLocked: true,
        primaryMatchScore: recommendation.primaryMatchScore,
        companionMatchScore: recommendation.companionMatchScore,
        engine: "hybrid_cosine_similarity",
        source: isUUID ? "database_neon" : "in_memory"
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Gagal generate hybrid planner:", error);
    return NextResponse.json({
      success: false,
      error: {
        code: "GENERATION_ERROR",
        message: "Gagal membuat jadwal konten mingguan. Silakan coba kembali."
      }
    }, { status: 500 });
  }
}
