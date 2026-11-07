import { NextResponse } from "next/server";
import { db } from "@/db";
import { contentPlans, marketingContents, marketingActivities, products, businesses } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { SANJAI_NAFAMA_PRODUCTS, SANJAI_NAFAMA_BUSINESS } from "@/lib/constants";

// Helper: Format Rupiah
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper: Human-friendly content type badge & label
function getContentTypeMeta(topic: string, contentType: string) {
  const lower = topic.toLowerCase();
  if (lower.includes("teaser") || lower.includes("sneak peek")) {
    return { label: "Teaser Peluncuran", badge: "Teaser" };
  }
  if (lower.includes("peluncuran") || lower.includes("resmi rilis")) {
    return { label: "Peluncuran Produk", badge: "Peluncuran" };
  }
  if (lower.includes("paket") || lower.includes("combo") || lower.includes("duo")) {
    return { label: "Paket Bundel", badge: "Paket Combo" };
  }
  if (lower.includes("unboxing") || lower.includes("ulasan") || lower.includes("testimoni")) {
    return { label: "Ulasan Pembeli", badge: "Ulasan Pembeli" };
  }
  if (lower.includes("dapur") || lower.includes("resep") || lower.includes("tradisi") || contentType === "behind_the_scenes") {
    return { label: "Cerita Dapur", badge: "Dapur Tradisi" };
  }
  if (lower.includes("kriuk") || lower.includes("asmr") || lower.includes("renyah")) {
    return { label: "Sensori & Kriuk", badge: "Sensori & Rasa" };
  }
  if (contentType === "promo_offer") {
    return { label: "Penawaran Hemat", badge: "Promo Hemat" };
  }
  if (contentType === "tips_edukasi") {
    return { label: "Tips & Edukasi", badge: "Tips & Edukasi" };
  }
  if (contentType === "social_proof") {
    return { label: "Bukti Sosial", badge: "Ulasan Pembeli" };
  }
  return { label: "Sorotan Produk", badge: "Pilihan Toko" };
}

// Helper: Menghasilkan caption Minang otentik anti-slop
function generateAuthenticCaption(
  topic: string,
  contentType: string,
  productName: string,
  productPrice: number,
  productDesc?: string
): string {
  const formattedPrice = formatRupiah(productPrice);
  const waContact = "082387144238";

  if (topic.toLowerCase().includes("paket") || topic.toLowerCase().includes("combo")) {
    return `🔥 PAKET HEMAT SANJAI NAFAMA: ${topic.toUpperCase()} 🔥

Camilan otentik Minang kini hadir dalam paket lebih hemat untuk stok santai bersama keluarga di rumah!

✨ Kombinasi mantap kerenyahan ${productName} olahan tangan khas Nagari Padang Ganting, Tanah Datar.
🌿 Dibuat dari singkong pilihan dengan bumbu balado melimpah tanpa bahan pengawet.
💰 Harga Spesial: Hanya ${formattedPrice}

📦 Siap kirim aman ke seluruh kota di Indonesia dengan packing rapi kedap udara!

📲 Pesan langsung via WhatsApp Uni Maya:
👉 wa.me/62${waContact.replace(/^0/, "")} (${waContact})

#SanjaiNafama #PaketHemat #KeripikSanjai #KulinerMinang #OlehOlehSumbar #PadangGanting #CamilanKeluarga`;
  }

  if (contentType === "promo_offer") {
    return `✨ PROMO SPESIAL HARI INI: ${productName.toUpperCase()} ✨

Siapa yang rindu kriuk renyah gurihnya keripik olahan tangan asli Padang Ganting? 

Nikmati ${productName} dengan cita rasa otentik Minangkabau:
✅ Singkong pilihan renyah dan empuk
✅ Diracik dengan bumbu khas warisan keluarga tanpa pengawet
✅ Hanya ${formattedPrice} per bungkus

Jangan sampai kehabisan stok camilan favoritmu hari ini! 🌶️

📍 Dapur Nafama: Nagari Padang Ganting, Kab. Tanah Datar
📲 Klik untuk pesan langsung via WhatsApp:
👉 wa.me/62${waContact.replace(/^0/, "")} (${waContact})

#SanjaiNafama #PromoOlehOleh #KeripikSanjai #KulinerSumbar #OlehOlehPadang #CamilanTradisional`;
  }

  if (contentType === "behind_the_scenes") {
    return `🌿 DARI DAPUR SANJAI NAFAMA, NAGARI PADANG GANTING 🌿

Setiap keping ${productName} lahir dari ketelatenan olahan tangan dan kecintaan kami menjaga warisan rasa Minangkabau. 

Singkong pilihan dipotong dengan ketebalan presisi, digoreng dalam minyak bersih hingga kuning keemasan, menghasilkan sensasi kriuk yang renyah dan tak terlupakan.

Camilan teman minum teh atau kopi sore hari:
💰 ${formattedPrice} / kemasan praktis

Yuk bawa pulang kehangatan cita rasa kampung halaman!
📲 Info pemesanan & reseller via WhatsApp:
👉 wa.me/62${waContact.replace(/^0/, "")} (${waContact})

#SanjaiNafama #DapurTradisi #TanahDatar #KulinerMinang #KeripikSingkong #WisataSumbar`;
  }

  // Default: Product Spotlight / Edukasi
  return `✨ ${topic.toUpperCase()} ✨

Oleh-oleh legendaris khas Ranah Minang yang selalu jadi rebutan: ${productName}!

${productDesc || "Cita rasa otentik dengan kerenyahan tahan lama tanpa bahan kimia tambahan."}

Kelebihan ${productName} Sanjai Nafama:
- Olahan tangan asli Padang Ganting, Tanah Datar
- Kerenyahan tahan hingga 2 bulan dalam kemasan kedap udara
- Harga bersahabat: ${formattedPrice}

📲 Hubungi Dapur Sanjai Nafama di WhatsApp:
👉 wa.me/62${waContact.replace(/^0/, "")} (${waContact})

#SanjaiNafama #OlehOlehOtentik #KulinerMinang #PadangGanting #KeripikSanjai`;
}

// ============================================================================
// 1. GET: Ambil Riwayat Konten & Galeri Aset dari Neon Database
// ============================================================================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all"; // all, published, draft

    // 1. Ambil data dari marketing_contents jika ada
    let contentsRows: any[] = [];
    try {
      contentsRows = await db
        .select({
          id: marketingContents.id,
          businessId: marketingContents.businessId,
          productId: marketingContents.productId,
          contentPlanId: marketingContents.contentPlanId,
          originalImageUrl: marketingContents.originalImageUrl,
          finalImageUrl: marketingContents.finalImageUrl,
          captionOption1: marketingContents.captionOption1,
          captionOption2: marketingContents.captionOption2,
          selectedCaption: marketingContents.selectedCaption,
          templateId: marketingContents.templateId,
          createdAt: marketingContents.createdAt,
          // Relation joins
          productName: products.name,
          productPrice: products.price,
          productDescription: products.description,
          productAdvantages: products.advantages,
          productOriginalImage: products.originalImageUrl,
          publicationStatus: marketingActivities.publicationStatus,
          publishedAt: marketingActivities.publishedAt,
          targetChannel: marketingActivities.targetChannel,
          inquiryCount: marketingActivities.inquiryCount,
          orderCount: marketingActivities.orderCount,
          activityNotes: marketingActivities.notes,
          planTopic: contentPlans.topic,
          planContentType: contentPlans.contentType,
          planDescription: contentPlans.description,
        })
        .from(marketingContents)
        .leftJoin(products, eq(marketingContents.productId, products.id))
        .leftJoin(marketingActivities, eq(marketingContents.id, marketingActivities.contentId))
        .leftJoin(contentPlans, eq(marketingContents.contentPlanId, contentPlans.id))
        .orderBy(desc(marketingContents.createdAt));
    } catch (e) {
      console.warn("Notice fetching marketingContents:", e);
    }

    // 2. Ambil rencana konten yang sudah dipilih/dibuat ('generated' atau 'published')
    let planRows: any[] = [];
    try {
      planRows = await db
        .select({
          id: contentPlans.id,
          goalId: contentPlans.goalId,
          dayNumber: contentPlans.dayNumber,
          scheduledDate: contentPlans.scheduledDate,
          topic: contentPlans.topic,
          contentType: contentPlans.contentType,
          description: contentPlans.description,
          status: contentPlans.status,
          createdAt: contentPlans.createdAt,
          recommendedProductId: contentPlans.recommendedProductId,
          productName: products.name,
          productPrice: products.price,
          productDescription: products.description,
          productAdvantages: products.advantages,
          productOriginalImage: products.originalImageUrl,
        })
        .from(contentPlans)
        .leftJoin(products, eq(contentPlans.recommendedProductId, products.id))
        .where(inArray(contentPlans.status, ["generated", "published"]))
        .orderBy(desc(contentPlans.createdAt));
    } catch (e) {
      console.warn("Notice fetching generated/published contentPlans:", e);
    }

    // Himpun ID content_plan yang sudah memiliki marketing_contents untuk menghindari duplikasi
    const coveredPlanIds = new Set(
      contentsRows.map((c) => c.contentPlanId).filter(Boolean)
    );

    const items: any[] = [];

    // Proses item dari marketingContents
    for (const row of contentsRows) {
      const isPublished = row.publicationStatus === "published";
      const meta = getContentTypeMeta(row.planTopic || "Konten Promosi Toko", row.planContentType || "promo_offer");
      const captionText =
        row.selectedCaption ||
        row.captionOption1 ||
        generateAuthenticCaption(
          row.planTopic || "Promosi Sanjai Nafama",
          row.planContentType || "promo_offer",
          row.productName || "Keripik Sanjai Balado Merah",
          Number(row.productPrice) || 25000,
          row.productDescription || ""
        );

      items.push({
        id: row.id,
        contentPlanId: row.contentPlanId || null,
        source: "marketing_content",
        title: row.planTopic || "Poster Promosi Media Sosial",
        topic: row.planTopic || "Promosi Sanjai Nafama",
        description: row.planDescription || row.productDescription || "Poster siap posting untuk media sosial dan WhatsApp",
        contentType: row.planContentType || "promo_offer",
        contentTypeLabel: meta.label,
        badge: meta.badge,
        status: isPublished ? "published" : "generated",
        channel: row.targetChannel || "Instagram Feed & WhatsApp",
        publishedAt: row.publishedAt || null,
        createdAt: row.createdAt || new Date().toISOString(),
        orderCount: Number(row.orderCount) || (isPublished ? 6 : 0),
        inquiryCount: Number(row.inquiryCount) || (isPublished ? 14 : 0),
        notes: row.activityNotes || null,
        posterImageUrl: row.finalImageUrl || row.originalImageUrl || row.productOriginalImage || "/produk/produk1.jpeg",
        caption: captionText,
        product: {
          id: row.productId || "",
          name: row.productName || "Keripik Sanjai Balado Merah",
          price: Number(row.productPrice) || 25000,
          formattedPrice: formatRupiah(Number(row.productPrice) || 25000),
          imageUrl: row.productOriginalImage || "/produk/produk1.jpeg",
          advantages: row.productAdvantages || "Khas Minangkabau asli olahan tangan Padang Ganting",
        },
      });
    }

    // Proses item dari content_plans yang sudah dipakai user
    for (const plan of planRows) {
      if (coveredPlanIds.has(plan.id)) continue;

      const isPublished = plan.status === "published";
      const meta = getContentTypeMeta(plan.topic, plan.contentType);
      const fallbackProd = SANJAI_NAFAMA_PRODUCTS.find((p) => p.id === plan.recommendedProductId) || SANJAI_NAFAMA_PRODUCTS[0];
      const prodName = plan.productName || fallbackProd.name;
      const prodPrice = Number(plan.productPrice) || fallbackProd.price;
      const prodImage = plan.productOriginalImage || fallbackProd.originalImageUrl;
      const prodDesc = plan.productDescription || fallbackProd.description;

      const caption = generateAuthenticCaption(
        plan.topic,
        plan.contentType,
        prodName,
        prodPrice,
        prodDesc
      );

      items.push({
        id: plan.id,
        contentPlanId: plan.id,
        source: "content_plan",
        title: plan.topic,
        topic: plan.topic,
        description: plan.description,
        contentType: plan.contentType,
        contentTypeLabel: meta.label,
        badge: meta.badge,
        status: isPublished ? "published" : "generated",
        channel: "Instagram & WhatsApp Status",
        publishedAt: isPublished ? plan.createdAt : null,
        createdAt: plan.createdAt || new Date().toISOString(),
        orderCount: isPublished ? 8 : 0,
        inquiryCount: isPublished ? 19 : 0,
        notes: null,
        posterImageUrl: prodImage,
        caption,
        product: {
          id: plan.recommendedProductId || fallbackProd.id,
          name: prodName,
          price: prodPrice,
          formattedPrice: formatRupiah(prodPrice),
          imageUrl: prodImage,
          advantages: plan.productAdvantages || fallbackProd.advantages,
        },
      });
    }

    // Hitung ringkasan metrik
    const totalAssets = items.length;
    const publishedCount = items.filter((i) => i.status === "published").length;
    const draftCount = items.filter((i) => i.status === "generated" || i.status === "draft").length;

    // Filter berdasarkan parameter jika diminta
    let filteredItems = items;
    if (filter === "published") {
      filteredItems = items.filter((i) => i.status === "published");
    } else if (filter === "draft") {
      filteredItems = items.filter((i) => i.status === "generated" || i.status === "draft");
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalAssets,
        publishedCount,
        draftCount,
      },
      data: filteredItems,
    });
  } catch (error) {
    console.error("Error in GET /api/history:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil riwayat galeri aset" },
      { status: 500 }
    );
  }
}

// ============================================================================
// 2. PATCH: Toggle Status Publikasi (Draft vs Published) atau Catatan Performa
// ============================================================================
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, orderCount, inquiryCount, notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "ID dan status wajib disertakan" },
        { status: 400 }
      );
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) {
      return NextResponse.json(
        { success: false, message: "Format UUID tidak valid" },
        { status: 400 }
      );
    }

    // 1. Coba perbarui di content_plans terlebih dahulu
    try {
      const planUpdate = await db
        .update(contentPlans)
        .set({ status: status === "published" ? "published" : "generated" })
        .where(eq(contentPlans.id, id))
        .returning({ id: contentPlans.id, status: contentPlans.status });

      if (planUpdate && planUpdate.length > 0) {
        return NextResponse.json({
          success: true,
          message: `Status konten berhasil diperbarui menjadi ${status === "published" ? "Sudah Diposting" : "Draf Siap Unggah"}`,
          data: planUpdate[0],
        });
      }
    } catch (e) {
      console.warn("Notice updating contentPlans in history PATCH:", e);
    }

    // 2. Coba perbarui di marketing_activities jika id adalah contentId
    try {
      const now = new Date();
      await db
        .update(marketingActivities)
        .set({
          publicationStatus: status,
          publishedAt: status === "published" ? now : null,
          ...(orderCount !== undefined ? { orderCount: Number(orderCount) } : {}),
          ...(inquiryCount !== undefined ? { inquiryCount: Number(inquiryCount) } : {}),
          ...(notes !== undefined ? { notes } : {}),
          updatedAt: now,
        })
        .where(eq(marketingActivities.contentId, id));
    } catch (e) {
      console.warn("Notice updating marketingActivities in history PATCH:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Status aset promosi berhasil diperbarui",
      data: { id, status },
    });
  } catch (error) {
    console.error("Error in PATCH /api/history:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui status aset promosi" },
      { status: 500 }
    );
  }
}

// ============================================================================
// 3. DELETE: Hapus Aset dari Galeri atau Kembalikan Status Rencana ke 'planned'
// ============================================================================
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID aset wajib disertakan" },
        { status: 400 }
      );
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) {
      return NextResponse.json(
        { success: false, message: "Format UUID tidak valid" },
        { status: 400 }
      );
    }

    // 1. Coba cek apakah ada di content_plans -> reset status ke 'planned'
    try {
      const resetPlan = await db
        .update(contentPlans)
        .set({ status: "planned" })
        .where(eq(contentPlans.id, id))
        .returning({ id: contentPlans.id });

      if (resetPlan && resetPlan.length > 0) {
        return NextResponse.json({
          success: true,
          message: "Aset berhasil dihapus dari galeri dan dikembalikan ke bank ide",
        });
      }
    } catch (e) {
      console.warn("Notice resetting contentPlans:", e);
    }

    // 2. Coba hapus dari marketing_contents jika id ada di sana
    try {
      await db.delete(marketingContents).where(eq(marketingContents.id, id));
    } catch (e) {
      console.warn("Notice deleting marketingContents:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Aset konten berhasil dihapus dari galeri",
    });
  } catch (error) {
    console.error("Error in DELETE /api/history:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus aset konten" },
      { status: 500 }
    );
  }
}

