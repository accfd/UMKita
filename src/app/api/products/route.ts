import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, businesses, users, marketingGoals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SANJAI_NAFAMA_PRODUCTS } from "@/lib/constants";

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

    // Jika Neon DB belum ada baris produk, kembalikan 5 produk otentik Sanjai Nafama
    return NextResponse.json(
      {
        success: true,
        data: SANJAI_NAFAMA_PRODUCTS,
        source: "fallback_sanjai_nafama"
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
      data: SANJAI_NAFAMA_PRODUCTS,
      source: "fallback_sanjai_nafama"
    });
  }
}

// POST: Tambah Produk Baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, advantages, originalImageUrl } = body;

    if (!name || !price) {
      return NextResponse.json({ success: false, message: "Nama dan harga produk wajib diisi" }, { status: 400 });
    }

    // 1. Pastikan bisnis Sanjai Nafama ada di DB
    let biz = await db.select().from(businesses).limit(1);
    let businessId = biz[0]?.id;

    if (!businessId) {
      let existingUsers = await db.select().from(users).where(eq(users.email, "owner@sanjainafama.com")).limit(1);
      let userId = existingUsers[0]?.id;

      if (!userId) {
        const [newUser] = await db.insert(users).values({
          email: "owner@sanjainafama.com",
          passwordHash: "securehash",
          fullName: "Owner Sanjai Nafama"
        }).returning();
        userId = newUser.id;
      }

      const [newBiz] = await db.insert(businesses).values({
        userId,
        businessName: "Sanjai Nafama",
        category: "kuliner",
        subCategory: "Oleh-oleh Khas Minang",
        description: "Usaha oleh-oleh keripik singkong balado dan camilan khas Nagari Padang Ganting.",
        location: "Padang Ganting, Tanah Datar",
        targetAudience: "Wisatawan, perantau Minang, dan pencinta camilan gurih"
      }).returning();
      businessId = newBiz.id;
    }

    // 2. Simpan produk baru
    const [inserted] = await db.insert(products).values({
      businessId,
      name: name.trim(),
      price: price.toString(),
      description: description?.trim() || "Olahan keripik singkong tradisional khas Nagari Padang Ganting, Tanah Datar.",
      advantages: advantages?.trim() || "Bahan alami tanpa pewarna buatan, renyah gurih tahan lama.",
      originalImageUrl: originalImageUrl || "/produk/produk1.jpeg",
      isActive: true
    }).returning();

    return NextResponse.json({
      success: true,
      data: {
        id: inserted.id,
        name: inserted.name,
        price: Number(inserted.price),
        category: "Kuliner Minang",
        description: inserted.description,
        advantages: inserted.advantages,
        originalImageUrl: inserted.originalImageUrl,
        badge: "Baru Ditambah",
        isActive: inserted.isActive
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Gagal tambah produk:", error);
    return NextResponse.json({
      success: false,
      error: "Gagal menyimpan produk ke database",
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

// PUT: Perbarui Produk
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, description, advantages, originalImageUrl } = body;

    if (!id || !name || !price) {
      return NextResponse.json({ success: false, message: "ID, nama, dan harga wajib diisi" }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      await db.update(products).set({
        name: name.trim(),
        price: price.toString(),
        description: description?.trim() || "",
        advantages: advantages?.trim() || "",
        ...(originalImageUrl ? { originalImageUrl } : {})
      }).where(eq(products.id, id));
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        name: name.trim(),
        price: Number(price),
        category: "Kuliner Minang",
        description: description?.trim() || "",
        advantages: advantages?.trim() || "",
        originalImageUrl,
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
      await db.update(products).set({
        isActive: Boolean(isActive)
      }).where(eq(products.id, id));
    }

    return NextResponse.json({
      success: true,
      data: { id, isActive: Boolean(isActive) }
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
      } catch (unlinkErr) {
        console.warn("Unlink foreign key marketingGoals:", unlinkErr);
      }
      await db.delete(products).where(eq(products.id, id));
    }

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus dari database"
    });
  } catch (error: any) {
    console.error("Gagal menghapus produk:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus produk", details: error?.message }, { status: 500 });
  }
}
