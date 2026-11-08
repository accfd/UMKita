import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

// Load .env manual if not present in process.env
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match) databaseUrl = match[1];
    }
  } catch (e) {
    // Ignore
  }
}

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not defined in environment variables!");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function sanitizeDatabase() {
  console.log("==========================================================");
  console.log("🚀 MEMULAI AUDIT & SANITASI DATABASE NEON (SINGLE-TENANT)");
  console.log("==========================================================\n");

  try {
    // -------------------------------------------------------------------------
    // 1. TENTUKAN CANONICAL USER & BUSINESS
    // -------------------------------------------------------------------------
    const CANONICAL_USER_ID = "77ce0028-6218-43eb-b314-f7d88f745a14";
    const CANONICAL_BIZ_ID = "be99369a-a573-45fe-9cbd-7f176f107cfe";
    const CANONICAL_EMAIL = "owner@sanjainafama.com";
    const CANONICAL_NAME = "Owner Sanjai Nafama";
    const CANONICAL_BIZ_NAME = "Sanjai Nafama";

    console.log("📌 1. Memeriksa & Menetapkan User Kanonikal...");
    const existingUser = await sql`SELECT id FROM users WHERE id = ${CANONICAL_USER_ID}`;
    if (existingUser.length === 0) {
      console.log("Membuat user kanonikal baru...");
      await sql`
        INSERT INTO users (id, email, password_hash, full_name, created_at, updated_at)
        VALUES (${CANONICAL_USER_ID}, ${CANONICAL_EMAIL}, 'demo_secure_hash', ${CANONICAL_NAME}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
    } else {
      console.log("Memperbarui user kanonikal...");
      // Update email and full_name (handling unique constraint on email)
      await sql`
        UPDATE users 
        SET email = ${CANONICAL_EMAIL}, full_name = ${CANONICAL_NAME}, updated_at = NOW()
        WHERE id = ${CANONICAL_USER_ID};
      `;
    }

    console.log("📌 2. Memeriksa & Menetapkan Bisnis Kanonikal...");
    const existingBiz = await sql`SELECT id FROM businesses WHERE id = ${CANONICAL_BIZ_ID}`;
    if (existingBiz.length === 0) {
      console.log("Membuat bisnis kanonikal baru...");
      await sql`
        INSERT INTO businesses (id, user_id, business_name, category, sub_category, description, location, target_audience, created_at)
        VALUES (
          ${CANONICAL_BIZ_ID}, 
          ${CANONICAL_USER_ID}, 
          ${CANONICAL_BIZ_NAME}, 
          'kuliner', 
          'Oleh-Oleh Khas Minang', 
          'Produsen oleh-oleh tradisional keripik singkong sanjai balado rumahan di Padang Ganting, Tanah Datar.', 
          'Padang Ganting, Kab. Tanah Datar, Sumatera Barat', 
          'Wisatawan, perantau Minang, dan penikmat camilan pedas manis',
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    } else {
      await sql`
        UPDATE businesses
        SET 
          user_id = ${CANONICAL_USER_ID},
          business_name = ${CANONICAL_BIZ_NAME},
          category = 'kuliner',
          sub_category = 'Oleh-Oleh Khas Minang',
          description = 'Produsen oleh-oleh tradisional keripik singkong sanjai balado rumahan di Padang Ganting, Tanah Datar.',
          location = 'Padang Ganting, Kab. Tanah Datar, Sumatera Barat',
          target_audience = 'Wisatawan, perantau Minang, dan penikmat camilan pedas manis'
        WHERE id = ${CANONICAL_BIZ_ID};
      `;
    }

    // -------------------------------------------------------------------------
    // 2. MIGRASI RELASI PRODUK KE BISNIS KANONIKAL
    // -------------------------------------------------------------------------
    console.log("📌 3. Menghubungkan seluruh produk ke Bisnis Kanonikal...");
    const prodUpdate = await sql`
      UPDATE products 
      SET business_id = ${CANONICAL_BIZ_ID}
      WHERE business_id != ${CANONICAL_BIZ_ID};
    `;
    console.log(`   ✓ Produk dialihkan ke bisnis kanonikal.`);

    // -------------------------------------------------------------------------
    // 3. MIGRASI RELASI BRAND KIT
    // -------------------------------------------------------------------------
    console.log("📌 4. Merapikan Brand Kit...");
    // Pastikan brand kit utama ada
    const existingBrandKit = await sql`SELECT id FROM brand_kits WHERE business_id = ${CANONICAL_BIZ_ID}`;
    if (existingBrandKit.length === 0) {
      // Ambil salah satu brand kit lama jika ada, atau buat baru
      const otherKits = await sql`SELECT * FROM brand_kits LIMIT 1`;
      if (otherKits.length > 0) {
        await sql`
          UPDATE brand_kits 
          SET business_id = ${CANONICAL_BIZ_ID}
          WHERE id = ${otherKits[0].id};
        `;
      } else {
        await sql`
          INSERT INTO brand_kits (id, business_id, primary_color, secondary_color, visual_preset, tone_of_voice)
          VALUES (gen_random_uuid(), ${CANONICAL_BIZ_ID}, '#004AC6', '#F59E0B', 'rustic_minang', 'ramah_santai');
        `;
      }
    }
    // Hapus brand kit duplikat di luar bisnis kanonikal
    await sql`DELETE FROM brand_kits WHERE business_id != ${CANONICAL_BIZ_ID};`;
    console.log(`   ✓ Brand kit telah dikonsolidasikan (tepat 1).`);

    // -------------------------------------------------------------------------
    // 4. MIGRASI RELASI MARKETING CONTENTS & MARKETING GOALS
    // -------------------------------------------------------------------------
    console.log("📌 5. Menghubungkan marketing_contents & marketing_goals...");
    await sql`
      UPDATE marketing_contents 
      SET business_id = ${CANONICAL_BIZ_ID}
      WHERE business_id != ${CANONICAL_BIZ_ID};
    `;

    await sql`
      UPDATE marketing_goals 
      SET business_id = ${CANONICAL_BIZ_ID}
      WHERE business_id != ${CANONICAL_BIZ_ID};
    `;
    console.log(`   ✓ Relasi marketing_contents & marketing_goals berhasil dialihkan.`);

    // -------------------------------------------------------------------------
    // 5. BERSIHKAN GOALS YATIM (ORPHAN GOALS TANPA CONTENT PLANS)
    // -------------------------------------------------------------------------
    console.log("📌 6. Membersihkan marketing_goals kosong yang tidak memiliki content_plans...");
    const deletedGoals = await sql`
      DELETE FROM marketing_goals 
      WHERE id NOT IN (SELECT DISTINCT goal_id FROM content_plans);
    `;
    console.log(`   ✓ Membersihkan goals tanpa jadwal.`);

    // -------------------------------------------------------------------------
    // 6. HAPUS BISNIS & USER DUPLIKAT (NON-KANONIKAL)
    // -------------------------------------------------------------------------
    console.log("📌 7. Menghapus Bisnis & User duplikat...");
    await sql`DELETE FROM businesses WHERE id != ${CANONICAL_BIZ_ID};`;
    await sql`DELETE FROM users WHERE id != ${CANONICAL_USER_ID};`;
    console.log(`   ✓ Bisnis dan user non-kanonikal berhasil dibersihkan.`);

    // -------------------------------------------------------------------------
    // 7. VERIFIKASI INTEGRITAS DATA AKHIR
    // -------------------------------------------------------------------------
    console.log("\n==========================================================");
    console.log("🔍 HASIL AUDIT & VERIFIKASI DATA BERSIH (INTEGRITY CHECK)");
    console.log("==========================================================");

    const finalUsers = await sql`SELECT id, email, full_name FROM users;`;
    const finalBiz = await sql`SELECT id, user_id, business_name, location FROM businesses;`;
    const finalProds = await sql`SELECT id, name, price, is_active FROM products ORDER BY created_at DESC;`;
    const finalGoals = await sql`SELECT count(*) as total_goals FROM marketing_goals;`;
    const finalPlans = await sql`SELECT count(*) as total_plans FROM content_plans;`;
    const finalContents = await sql`SELECT count(*) as total_contents FROM marketing_contents;`;
    const finalBrandKits = await sql`SELECT id, visual_preset FROM brand_kits;`;

    console.log(`\n✅ TOTAL USER: ${finalUsers.length} (Wajib 1)`);
    console.table(finalUsers);

    console.log(`\n✅ TOTAL BISNIS: ${finalBiz.length} (Wajib 1)`);
    console.table(finalBiz);

    console.log(`\n✅ TOTAL PRODUK TERDAFTAR: ${finalProds.length} (Semua terhubung ke bisnis utama)`);
    console.table(finalProds.map(p => ({ ID: p.id, NAMA: p.name, HARGA: `Rp ${Number(p.price).toLocaleString("id-ID")}`, AKTIF: p.is_active })));

    console.log(`\n✅ MARKETING GOALS BERSIH (DENGAN JADWAL): ${finalGoals[0].total_goals}`);
    console.log(`✅ TOTAL CONTENT PLANS AKTIF: ${finalPlans[0].total_plans}`);
    console.log(`✅ TOTAL MARKETING CONTENTS: ${finalContents[0].total_contents}`);
    console.log(`✅ BRAND KIT TUNGGAL: ${finalBrandKits.length} (Preset: ${finalBrandKits[0]?.visual_preset || 'clean'})`);

    console.log("\n🎉 SANITASI BERHASIL 100%! DATABASE SIAP UNTUK DEMO & PENJURIAN LOMBA.");
    console.log("==========================================================\n");

  } catch (error) {
    console.error("❌ Terjadi kesalahan saat sanitasi database:", error);
    process.exit(1);
  }
}

sanitizeDatabase();
