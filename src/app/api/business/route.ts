import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const bizList = await db.select().from(businesses).limit(1);

    if (bizList.length > 0) {
      const b = bizList[0];
      return NextResponse.json({
        success: true,
        data: {
          id: b.id,
          businessName: b.businessName,
          category: b.category,
          subCategory: b.subCategory || "Oleh-Oleh Khas Minang",
          description: b.description,
          location: b.location,
          targetAudience: b.targetAudience
        }
      });
    }

    // Fallback default jika tabel businesses kosong
    return NextResponse.json({
      success: true,
      data: {
        id: "biz-demo-01",
        businessName: "Sanjai Nafama",
        category: "kuliner",
        subCategory: "Oleh-Oleh Khas Padang Ganting",
        description: "Produsen oleh-oleh tradisional keripik singkong sanjai balado rumahan di Padang Ganting, Tanah Datar.",
        location: "Padang Ganting, Kab. Tanah Datar, Sumatera Barat",
        targetAudience: "Wisatawan, perantau Minang, dan penikmat camilan pedas manis"
      }
    });
  } catch (error) {
    console.error("Gagal mengambil data profil usaha:", error);
    return NextResponse.json({
      success: false,
      error: "Gagal mengambil data profil usaha"
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessName, category, subCategory, description, location, targetAudience } = body;

    const existingBiz = await db.select().from(businesses).limit(1);

    if (existingBiz.length > 0) {
      const [updated] = await db
        .update(businesses)
        .set({
          businessName: businessName || existingBiz[0].businessName,
          category: category || existingBiz[0].category,
          subCategory: subCategory || existingBiz[0].subCategory,
          description: description || existingBiz[0].description,
          location: location || existingBiz[0].location,
          targetAudience: targetAudience || existingBiz[0].targetAudience,
        })
        .where(eq(businesses.id, existingBiz[0].id))
        .returning();

      return NextResponse.json({
        success: true,
        data: updated
      });
    } else {
      // Create user first if needed
      let userList = await db.select().from(users).limit(1);
      let userId = userList[0]?.id;

      if (!userId) {
        const [newUser] = await db.insert(users).values({
          email: "owner@umkita.id",
          passwordHash: "secure_demo_hash",
          fullName: "Pemilik Toko UMKM",
        }).returning();
        userId = newUser.id;
      }

      const [newBiz] = await db.insert(businesses).values({
        userId,
        businessName: businessName || "Sanjai Nafama",
        category: category || "kuliner",
        subCategory: subCategory || "Oleh-Oleh Khas Minang",
        description: description || "Usaha kuliner oleh-oleh khas Sumatera Barat",
        location: location || "Sumatera Barat",
        targetAudience: targetAudience || "Masyarakat umum dan wisatawan",
      }).returning();

      return NextResponse.json({
        success: true,
        data: newBiz
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Gagal menyimpan profil usaha:", error);
    return NextResponse.json({
      success: false,
      error: "Gagal menyimpan profil usaha"
    }, { status: 500 });
  }
}

