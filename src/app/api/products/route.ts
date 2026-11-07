import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, businesses, users, marketingGoals, contentPlans, marketingContents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SANJAI_NAFAMA_PRODUCTS, SanjaiProduct } from "@/lib/constants";
import {
  getPersistentProducts,
  addPersistentProduct,
  updatePersistentProduct,
  togglePersistentProductActive,
  deletePersistentProduct,
} from "@/lib/products-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let dbProducts: any[] = [];
    try {
      dbProducts = await db.select().from(products).orderBy(desc(products.createdAt));
    } catch (dbErr) {
      console.warn("Koneksi DB offline atau tabel belum ada data:", dbErr);
    }

    if (dbProducts && dbProducts.length > 0) {
      const formatted = dbProducts.map((p, idx) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price) || 25000,
        category: "Kuliner Minang",
        description: p.description,
        advantages: p.advantages,
        originalImageUrl:
          p.originalImageUrl ||
          SANJAI_NAFAMA_PRODUCTS[idx % SANJAI_NAFAMA_PRODUCTS.length]?.originalImageUrl ||
          "/produk/produk1.jpeg",
        cutoutImageUrl:
          p.id === "prod-sanjai-balado"
            ? "/assets/produk3_cutout_ai.png"
            : (p.cutoutImageUrl ||
              SANJAI_NAFAMA_PRODUCTS.find((sp) => sp.id === p.id)?.cutoutImageUrl ||
              SANJAI_NAFAMA_PRODUCTS[idx % SANJAI_NAFAMA_PRODUCTS.length]?.cutoutImageUrl),
        badge: idx === 0 ? "Baru / Unggulan" : idx === 1 ? "Terlaris" : "Khas Minang",
        isActive: p.isActive ?? true
      }));

      return NextResponse.json(
        {
          success: true,
          data: formatted,
          source: "database_neon"
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        }
      );
    }

    // Mengambil dari storage lokal yang persisten
    const persistentList = getPersistentProducts();

    return NextResponse.json(
      {
        success: true,
        data: persistentList,
        source: "persistent_store"
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
        }
      }
    );
  } catch (error) {
    console.error("Gagal mengambil data produk:", error);
    return NextResponse.json({
      success: true,
      data: getPersistentProducts(),
      source: "fallback_persistent_store"
    });
  }
}

// POST: Tambah Produk Baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, advantages, originalImageUrl, cutoutImageUrl } = body;

    if (!name || !price) {
      return NextResponse.json({ success: false, message: "Nama dan harga produk wajib diisi" }, { status: 400 });
    }

    let dbInserted: any = null;

    // 1. Coba simpan ke Neon DB jika koneksi database tersedia
    try {
      let biz = await db.select().from(businesses).limit(1);
      let businessId = biz[0]?.id;

      if (!businessId) {
        let existingUsers = await db.select().from(users).where(eq(users.email, "owner@sanjainafama.com")).limit(1);
        let userId = existingUsers[0]?.id;

        if (!userId) {
          const [newUser] = await db.insert(users).values({
            email: "owner@sanjainafama.com",
            passwordHash: "securehash",
            fullName: "Uni Maya",
          }).returning();
          userId = newUser.id;
        }

        const [newBiz] = await db.insert(businesses).values({
          userId: userId,
          businessName: "Sanjai Nafama",
          category: "kuliner",
          subCategory: "Oleh-oleh Minang",
          description: "Olahan Sanjai Otentik Padang Ganting",
          location: "Padang Ganting, Tanah Datar",
          targetAudience: "wisatawan_minang"
        }).returning();
        businessId = newBiz.id;
      }

      const [inserted] = await db.insert(products).values({
        businessId: businessId,
        name: name.trim(),
        price: price.toString(),
        description: description?.trim() || "Olahan camilan khas Minangkabau asli olahan tangan Nagari Padang Ganting, Tanah Datar.",
        advantages: advantages?.trim() || "Bahan alami tanpa pewarna buatan, renyah gurih tahan lama.",
        originalImageUrl: originalImageUrl || "/produk/produk1.jpeg",
        isActive: true
      }).returning();
      dbInserted = inserted;
    } catch (dbErr) {
      console.warn("[DB Notice] Neon DB offline, fallback menyimpan ke local persistent store:", dbErr);
    }

    // 2. Selalu simpan di persistent products store agar katalog tersimpan permanen
    const newProduct: SanjaiProduct = {
      id: dbInserted?.id || `prod-${Date.now()}`,
      name: name.trim(),
      price: Number(price),
      category: "Kuliner Minang",
      description: description?.trim() || "Olahan camilan khas Minangkabau asli olahan tangan Nagari Padang Ganting, Tanah Datar.",
      advantages: advantages?.trim() || "Bahan alami tanpa pewarna buatan, renyah gurih tahan lama.",
      originalImageUrl: originalImageUrl || "/produk/produk2.jpg",
      cutoutImageUrl: cutoutImageUrl || originalImageUrl || "/assets/produk2_cutout_ai.png",
      badge: "Baru Ditambah",
      isActive: true
    };

    addPersistentProduct(newProduct);

    return NextResponse.json({
      success: true,
      data: newProduct
    }, { status: 201 });

  } catch (error: any) {
    console.error("Gagal tambah produk:", error);
    return NextResponse.json({
      success: false,
      error: "Gagal menyimpan produk",
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

// PUT: Perbarui Produk
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, description, advantages, originalImageUrl, cutoutImageUrl } = body;

    if (!id || !name || !price) {
      return NextResponse.json({ success: false, message: "ID, nama, dan harga wajib diisi" }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      try {
        await db.update(products).set({
          name: name.trim(),
          price: price.toString(),
          description: description?.trim() || "",
          advantages: advantages?.trim() || "",
          ...(originalImageUrl ? { originalImageUrl } : {})
        }).where(eq(products.id, id));
      } catch (dbErr) {
        console.warn("[DB Notice] Update DB failed, updating persistent store:", dbErr);
      }
    }

    const updated = updatePersistentProduct(id, {
      name: name.trim(),
      price: Number(price),
      description: description?.trim() || "",
      advantages: advantages?.trim() || "",
      ...(originalImageUrl ? { originalImageUrl } : {}),
      ...(cutoutImageUrl ? { cutoutImageUrl } : {})
    });

    return NextResponse.json({
      success: true,
      data: updated || {
        id,
        name: name.trim(),
        price: Number(price),
        category: "Kuliner Minang",
        description: description?.trim() || "",
        advantages: advantages?.trim() || "",
        originalImageUrl,
        cutoutImageUrl,
        isActive: true
      }
    });
  } catch (error: any) {
    console.error("Gagal update produk:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui produk", details: error?.message }, { status: 500 });
  }
}

// PATCH: Toggle Status Aktif / Nonaktif
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, isActive } = body;

    if (!id || isActive === undefined) {
      return NextResponse.json({ success: false, message: "ID dan status isActive wajib diisi" }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      try {
        await db.update(products).set({
          isActive: Boolean(isActive)
        }).where(eq(products.id, id));
      } catch (dbErr) {
        console.warn("[DB Notice] PATCH DB failed, updating persistent store:", dbErr);
      }
    }

    const toggled = togglePersistentProductActive(id);

    return NextResponse.json({
      success: true,
      data: toggled || { id, isActive: Boolean(isActive) }
    });
  } catch (error: any) {
    console.error("Gagal update status produk:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui status ketersediaan" }, { status: 500 });
  }
}

// DELETE: Hapus Produk
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID wajib diisi" }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      try {
        await db.update(marketingGoals).set({ targetProductId: null }).where(eq(marketingGoals.targetProductId, id));
        await db.update(contentPlans).set({ recommendedProductId: null }).where(eq(contentPlans.recommendedProductId, id));
        await db.update(marketingContents).set({ productId: null }).where(eq(marketingContents.productId, id));
        await db.delete(products).where(eq(products.id, id));
      } catch (dbErr) {
        console.warn("[DB Notice] Delete DB failed, deleting from persistent store:", dbErr);
      }
    }

    deletePersistentProduct(id);

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus"
    });
  } catch (error: any) {
    console.error("Gagal menghapus produk:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus produk", details: error?.message }, { status: 500 });
  }
}
