import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { marketingContents } from "@/db/schema";
import { memoryContentsStore, MarketingContentRecord } from "@/lib/memory-store";

/**
 * Endpoint: POST /api/marketing/contents
 * Spesifikasi Sesuai api-contract.md (Modul 4.2 - FERDI)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, contentPlanId, format, templateId, finalMediaUrl, caption, hashtags } = body;

    const contentId = `cnt-${Date.now().toString().slice(-6)}`;
    const savedAt = new Date().toISOString();

    const record: MarketingContentRecord = {
      id: contentId,
      productId: productId || null,
      contentPlanId: contentPlanId || null,
      format: format || "POSTER",
      templateId: templateId || "claymorphism",
      finalMediaUrl: finalMediaUrl || "",
      caption: caption || "",
      hashtags: hashtags || [],
      savedAt,
      createdAt: savedAt,
      activity: {
        publicationStatus: "draft",
        inquiryCount: 0,
        orderCount: 0,
      },
    };

    // Coba simpan ke DB Neon via Drizzle
    try {
      await db.insert(marketingContents).values({
        id: crypto.randomUUID(),
        businessId: "biz-sanjai-01" as any,
        productId: productId || null,
        contentPlanId: contentPlanId || null,
        originalImageUrl: finalMediaUrl || "",
        finalImageUrl: finalMediaUrl || "",
        captionOption1: caption || "",
        captionOption2: caption || "",
        templateId: templateId || "claymorphism",
      });
    } catch (dbErr) {
      console.warn("[DB Warning] Menyimpan ke local memory store:", dbErr);
    }

    // Selalu simpan di memory store agar endpoint GET /api/history langsung terisi
    memoryContentsStore.unshift(record);

    return NextResponse.json(
      {
        success: true,
        data: {
          contentId,
          savedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API /api/marketing/contents Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Gagal menyimpan konten promosi.",
        },
      },
      { status: 500 }
    );
  }
}
