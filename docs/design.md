# Design System & UI Specifications: UMKita (`design.md`)

## 1. Overview & Aesthetic Direction

### 1.1 Konsep Visual: Claymorphism
**UMKita** mengadopsi gaya visual **Claymorphism** modern. Pendekatan ini memadukan estetika objek 3D tanah liat yang empuk (*tactile, inflated volume*), sudut melengkung ekstra besar (*super-rounded corners*), dan bayangan ganda (*dual inner & drop shadows*).

### 1.2 Mengapa Claymorphism untuk UMKita?
* **Ramah & Tidak Mengintimidasi:** Pelaku UMKM sering kali merasa asing atau kewalahan dengan dashboard SaaS tradisional yang kaku, datar, dan penuh tabel teknis. Bentuk 3D yang empuk memberikan kesan seperti mainan interaktif yang menyenangkan dan mudah disentuh.
* **Affordance yang Sangat Jelas:** Efek timbul (*raised volume*) membuat tombol (*buttons*), tabulasi (*tabs*), dan kartu (*cards*) terlihat nyata dan intuitif untuk diklik/ditekan.
* **Kontras yang Kuat untuk Foto Produk:** Latar belakang dan kartu bergaya tanah liat pastel netral memberikan kanvas sempurna agar foto kuliner dan produk UMKM terlihat menonjol (*pop-out*).

### 1.3 Mood & Karakter Antarmuka
* **Friendly & Approachable:** Hangat, santai, dan bersahabat bagi pelaku usaha non-teknis.
* **Modern & Playful:** Segar, interaktif, dengan animasi transisi yang mulus (*bouncy & smooth*).
* **Organized & Clear:** Menjaga hirarki informasi tetap terstruktur rapi untuk perencanaan 7 hari dan studio visual.

---

## 2. Color Palette & Design Tokens

### 2.1 Palet Warna Utama & Semantik
| Peran Token | Nama Warna | Kode HEX | Nilai RGB | Penggunaan / Konteks |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Base** | Royal Sky Blue | `#2563EB` | `37, 99, 235` | Tombol CTA utama, status aktif, kartu sorotan |
| **Primary Light** | Cloud Blue | `#EFF6FF` | `239, 246, 255` | Latar kartu clay sekunder, chip kategori |
| **Secondary Accent**| Golden Rempah | `#F59E0B` | `245, 158, 11` | Lencana harga, kuliner Minang, badge promo khusus |
| **Background Canvas**| Soft Ice Gradient | `#F8FAFC` $\rightarrow$ `#E2E8F0` | - | Latar belakang seluruh halaman aplikasi |
| **Success / Published**| Mint Emerald | `#10B981` | `16, 185, 129` | Status "Sudah Diposting", konfirmasi simpan |
| **Warning / Draft** | Sun Amber | `#FBBF24` | `251, 191, 36` | Status "Belum Dibuat", indikator proses AI |
| **Urgent / Hot Deal**| Coral Chili | `#EF4444` | `239, 68, 68` | Badge diskon terbatas, tombol hapus |
| **Text Dark** | Deep Slate | `#1E293B` | `30, 41, 59` | Judul halaman, nama produk, teks utama |
| **Text Muted** | Cool Slate | `#64748B` | `100, 116, 139` | Subjudul, petunjuk form, label sekunder |
| **Card Surface** | Pure Clay White | `#FFFFFF` | `255, 255, 255` | Permukaan kartu utama dengan inner shadow |

### 2.2 Palet Preset Branding Visual (6 Presets)
| Nama Preset | Warna Latar / Gradien | Warna Aksen / Tipografi | Karakteristik Desain |
| :--- | :--- | :--- | :--- |
| **1. Rustic Minang** | `#2C1810` (Dark Wood) $\rightarrow$ `#4A2E1B` | `#D97706` (Golden Rempah) & `#DC2626` (Chili Red) | Tekstur rempah, kayu jati Minang, ukiran tradisional |
| **2. Claymorphism** | `#EFF6FF` (Cloud Blue) $\rightarrow$ `#DBEAFE` | `#2563EB` (Royal Blue) & `#F59E0B` (Amber) | Objek 3D empuk, bayangan ganda ceria, modern pop |
| **3. Editorial Magazine** | `#FBFBFB` (Off-white) $\rightarrow$ `#F3F4F6` | `#111827` (Noir) & `#4B5563` (Charcoal) | Tipografi serif elegan, minimalis majalah kuliner |
| **4. Clean Minimalist** | `#FFFFFF` (Pure Studio) $\rightarrow$ `#F8FAFC` | `#0284C7` (Sky Slate) & `#0F172A` (Obsidian) | Latar studio bersih, drop shadow lembut, modern bersih |
| **5. Bold Punch Promo** | `#DC2626` (Vibrant Red) $\rightarrow$ `#EA580C` (Orange) | `#FEF08A` (Bright Yellow) & `#FFFFFF` | Badge diskon miring mencolok, teks tebal penuh energi |
| **6. Nostalgia Vintage** | `#FDF6E2` (Warm Paper) $\rightarrow$ `#EEDAA2` | `#78350F` (Kopi Klasik) & `#92400E` (Sepia) | Nuansa tempo doeloe, cap stempel klasik, otentik |

---

## 3. Sistem Tipografi (Typography Hierarchy)

* **Font Primer:** `Plus Jakarta Sans` (Pilihan Utama, sangat modern & ramah) atau `Inter` sebagai cadangan.
* **Karakter:** Sans-Serif geometris dengan lengkungan organik yang melengkapi estetika Claymorphism.

| Skala Tipografi | Weight | Ukuran (Desktop) | Ukuran (Mobile) | Line Height | Penggunaan di UMKita |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | Bold (700) | 32px | 26px | 1.2 | Header Onboarding & Sapaan Utama Dashboard |
| **Heading 1** | SemiBold (600) | 24px | 20px | 1.3 | Judul Fitur (Studio Visual, Content Planner) |
| **Heading 2** | SemiBold (600) | 18px | 16px | 1.35 | Judul Kartu Hari, Nama Produk, Sub-bagian |
| **Body Large** | Medium (500) | 15px | 14px | 1.4 | Teks Rekomendasi Pemasaran, Preview Caption |
| **Body Small** | Regular (400) | 13px | 12px | 1.45 | Deskripsi Produk, Catatan Bantuan, Tooltip |
| **Micro / Badge** | SemiBold (600) | 11px | 10px | 1.2 | Tagar, Label Status, Lencana Tanggal |

---

## 4. Spesifikasi Fisik Claymorphism (Visual Effects & Tokens)

### 4.1 Radius Sudut (Border Radius)
* **Wadah Besar & Modal Dialog:** `32px` (`rounded-3xl` s/d `rounded-[32px]`)
* **Kartu Produk & Jadwal Konten:** `24px` – `28px`
* **Kotak Input / Upload Dropzone:** `20px`
* **Tombol & Tab Navigasi:** `999px` (*Full Capsule / Pill Shape*)
* **Badge / Chips / Status Tag:** `14px` – `16px`

### 4.2 Spesifikasi Shadow & Kedalaman 3D (CSS Code Tokens)

```css
/* ==============================================================
   CLAYMORPHISM CORE UTILITY CLASSES (Tailwind / Custom CSS)
   ============================================================== */

/* 1. Standard Clay Card (Permukaan Putih Timbul) */
.clay-card {
  background: #FFFFFF;
  border-radius: 28px;
  box-shadow: 
    10px 14px 24px rgba(148, 163, 184, 0.22),
    inset -4px -4px 8px rgba(203, 213, 225, 0.5),
    inset 4px 4px 8px rgba(255, 255, 255, 0.95);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}

.clay-card:hover {
  transform: translateY(-3px);
  box-shadow: 
    12px 18px 28px rgba(148, 163, 184, 0.28),
    inset -4px -4px 8px rgba(203, 213, 225, 0.5),
    inset 4px 4px 8px rgba(255, 255, 255, 0.95);
}

/* 2. Inset Clay Card (Untuk Area Input & Dropzone Foto) */
.clay-inset {
  background: #F1F5F9;
  border-radius: 22px;
  box-shadow: 
    inset 4px 4px 8px rgba(148, 163, 184, 0.3),
    inset -4px -4px 8px rgba(255, 255, 255, 0.9);
}

/* 3. Primary Blue Clay Button (Empuk & Berenergi) */
.clay-btn-primary {
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: #FFFFFF;
  border-radius: 9999px;
  padding: 12px 28px;
  font-weight: 600;
  box-shadow: 
    0 10px 20px rgba(37, 99, 235, 0.35),
    inset -3px -3px 6px rgba(0, 0, 0, 0.25),
    inset 3px 3px 6px rgba(255, 255, 255, 0.4);
  transition: all 0.15s ease-in-out;
}

.clay-btn-primary:active {
  transform: translateY(2px) scale(0.98);
  box-shadow: 
    0 4px 10px rgba(37, 99, 235, 0.3),
    inset 2px 2px 4px rgba(0, 0, 0, 0.35);
}

/* 4. Amber Clay Button (Untuk Aksi Sekunder / Promosi) */
.clay-btn-accent {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: #FFFFFF;
  border-radius: 9999px;
  padding: 12px 28px;
  font-weight: 600;
  box-shadow: 
    0 10px 20px rgba(217, 119, 6, 0.35),
    inset -3px -3px 6px rgba(0, 0, 0, 0.2),
    inset 3px 3px 6px rgba(255, 255, 255, 0.4);
}

/* 5. Colored Highlight Card (Hari Aktif di Kalender) */
.clay-card-active {
  background: linear-gradient(145deg, #2563EB 0%, #1D4ED8 100%);
  color: #FFFFFF;
  border-radius: 28px;
  box-shadow: 
    8px 14px 22px rgba(37, 99, 235, 0.35),
    inset -4px -4px 8px rgba(15, 23, 42, 0.3),
    inset 4px 4px 8px rgba(255, 255, 255, 0.3);
}

/* 6. Clay Pill Badge */
.clay-pill-badge {
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 
    3px 4px 8px rgba(148, 163, 184, 0.2),
    inset -2px -2px 4px rgba(0, 0, 0, 0.08),
    inset 2px 2px 4px rgba(255, 255, 255, 0.8);
}
```

---

## 5. Spesifikasi Komponen Kunci (UMKita Core Components)

### 5.1 Kartu Jadwal 7 Hari (*Clay Content Plan Card*)
* **Wujud:** Kartu vertikal empuk (*rounded 28px*) yang menampilkan status konten harian.
* **Elemen:**
  - *Day Badge:* Bentuk kapsul clay di sudut kiri atas (`HARI 1`, `HARI 2`).
  - *Content Type Chip:* Warna lembut penanda jenis konten (Biru untuk *Product Spotlight*, Ungu untuk *Behind The Scenes*, Emas untuk *Promo Diskon*).
  - *Topic Title:* Teks tebal ukuran 16px.
  - *Action Trigger:* Tombol empuk mini bertuliskan *"Buka di Studio"* yang langsung mengarahkan ke AI Studio dengan data produk terisi otomatis.

### 5.2 Kotak Unggah Foto (*Clay Inset Dropzone*)
* **Wujud:** Kontainer cekung ke dalam (*inset shadow*) yang memberi ilusi "wadah tempat meletakkan foto".
* **Interaksi:**
  - *Empty State:* Ikon kamera 3D mengambang + teks ajakan: *"Tarik foto produkmu ke sini atau klik untuk memilih"*.
  - *Processing State:* Efek gelombang lembut dengan progress bar clay berwarna biru saat model WASM memproses background removal.
  - *Success State:* Tampilan perbandingan *Slider Before & After* (foto asli vs foto transparan hasil AI).

### 5.3 Studio Visual Poster (*Clay Preview Frame & Preset Selector*)
* **Wujud:** Kanvas persegi 1:1 diapit oleh bingkai clay putih tebal dengan bayangan jatuh lembut.
* **Toolbar Kontrol Cepat:**
  - **Selector 6 Preset:** Grid 6 kartu mini berikon visual (*Rustic Minang, Claymorphism, Editorial, Clean, Bold Promo, Vintage*).
  - **Sakelar AI Color Harmony:** Tombol sakelar untuk mengekstrak palet dominan langsung dari foto kuliner (misal merah cabai Sanjai atau cokelat karamel Rendang) dan menyelaraskannya dengan warna template poster.
  - **Kontrol Harga & Badge Promo:** Toggle sakelar untuk menampilkan badge diskon ("Hemat 20%"), stempel halal, atau harga resmi.

### 5.4 Generator Motion Reel Vertikal 9:16 (*Motion Video Studio*)
* **Wujud:** Frame ponsel vertikal 9:16 dengan tombol kontrol *"Pratinjau Animasi"* dan *"Ekspor Video (WebM/MP4)"*.
* **Mekanisme Render:**
  - Berjalan sepenuhnya di sisi klien (*client-side*) memanfaatkan **HTML5 Canvas 60 FPS** dan **MediaRecorder API**.
  - Menggabungkan elemen foto produk transparan (*Ken Burns slow zoom*), partikel rempah mengambang lembut, teks penawaran yang muncul berirama, dan watermark nama toko.
  - Menghasilkan video siap unggah berdurasi 5–10 detik tanpa membebani server backend atau kuota GPU eksternal.

### 5.5 Generator Copywriting & Storyboard (*Clay Copyable Box*)
* **Wujud:** Kartu clay berdampingan (Opsi A: *Gaya Cerita / Storytelling Minang*, Opsi B: *Gaya Promo Langsung / Hard Selling*).
* **Fitur Utama:** Tombol *"Salin Teks"* dan *"Bagikan ke Medsos"* (Web Share API) berdesain pill timbul yang memicu haptic feedback dan toast konfirmasi.

---

## 6. Layout & Responsive Grid System

### 6.1 Breakpoint Spesifikasi
* **Mobile Viewport (360px – 640px):** Single column stack, navigasi bawah mengambang (*Floating Clay Bottom Bar*), kartu kalender horizontal swipeable.
* **Tablet Viewport (641px – 1024px):** 2 kolom grid, menu samping semi-terbuka.
* **Desktop Viewport (1025px+):** Sidebar kiri tetap (Profil UMKM & Brand Kit), area tengah dinamis (Kalender / Studio Foto), dan panel kanan (Preview Poster & Caption).

### 6.2 Navigasi Clay Mengambang (*Floating Bottom Bar* pada Mobile)
```
+--------------------------------------------------------------+
|   [ 🏠 Beranda ]   [ 📅 Jadwal ]   [ ✨ Studio ]   [ 📊 Riwayat ]  |
+--------------------------------------------------------------+
```
* Terletak 20px dari bawah layar, memiliki radius `999px`, background putih semi-transparan (*glass-clay effect* dengan `backdrop-blur-md`), dan tombol aktif berbentuk kapsul biru timbul.

---

## 7. Keselarasan Antarmuka 8 Layar dengan PRD & SRS

| ID Layar | Rute URL | Nama Layar | Spesifikasi Desain Claymorphism |
| :--- | :--- | :--- | :--- |
| **SCR-01** | `/login` | Layar Autentikasi | Kartu clay putih mengambang, form inset empuk, dan tombol kapsul 1-klik akun demo interaktif. |
| **SCR-02** | `/onboarding` | Layar Onboarding Usaha | Multi-step wizard dengan progress bar tanah liat, pilihan kategori pil empuk, dan *Clay Color Swatch*. |
| **SCR-03** | `/dashboard` | Layar Dashboard Utama | Kartu sapaan hero personal, ringkasan jadwal hari ini, dan *Floating Clay Bottom Bar* pada mobile. |
| **SCR-04** | `/products` | Layar Katalog Produk | Grid kartu produk clay timbul (*rounded-28px*), badge harga melengkung, dan modal tambah produk cekung. |
| **SCR-05** | `/marketing/assistant` | Layar Asisten Pemasaran | 4 kartu pilihan tujuan kampanye 3D berukuran besar dengan ikon timbul dan efek *pressed state*. |
| **SCR-06** | `/marketing/planner` | Layar Kalender 7 Hari | Timeline kartu 7 hari dengan chip warna kategori konten dan badge status empuk (*Planned / Generated*). |
| **SCR-07** | `/studio` | Layar AI Content Studio | Dropzone foto cekung (*clay-inset*), selector 6 preset branding, AI Color Harmony toggle, canvas poster 1:1, video reel 9:16, & tombol salin caption. |
| **SCR-08** | `/history` | Layar Galeri Aset Brand | Galeri arsip poster visual dan video motion reel siap pakai dengan status publikasi ke media sosial. |

Dokumen `design.md` ini selaras 100% dengan `prd.md` dan `srs.md` sebagai acuan desain antarmuka (*Tailwind CSS & React*) pada Next.js.
