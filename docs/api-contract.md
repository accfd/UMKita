# SPESIFIKASI KONTRAK API (API CONTRACT SPECIFICATION)
## UMKita — Asisten Branding Visual & Pemasaran Cerdas UMKM
**Hackathon FIRETECH 2026 • Telkom AI Center Padang**

---

### 📌 Ringkasan & Aturan Umum Komunikasi
* **Base URL:** `http://localhost:3000/api`
* **Format Data:** `application/json` (UTF-8)
* **Arsitektur:** Next.js 15 App Router (Route Handlers) & Server-side Actions
* **Database Target:** Neon PostgreSQL via Drizzle ORM ([`src/db/schema.ts`](file:///d:/LOMBA/FIRETECH%20-%20V1/src/db/schema.ts))
* **Tipe Data TypeScript:** Terpusat di [`src/types/index.ts`](file:///d:/LOMBA/FIRETECH%20-%20V1/src/types/index.ts)

#### Standar Format Response (Global Envelope):
Semua response API dibungkus format yang seragam:

```json
// Response Berhasil (200 / 201):
{
  "success": true,
  "data": { ... }
}

// Response Gagal (400 / 404 / 500):
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR" | "AI_OFFLINE_FALLBACK",
    "message": "Penjelasan error yang mudah dipahami dalam Bahasa Indonesia"
  }
}
```

---

# 📦 MODUL 1: MANAJEMEN AKUN & BRAND KIT
**Penanggung Jawab (PIC): RAFA**  
**Cakupan FR:** FR-01 s/d FR-04

---

### 1.1 Autentikasi 1-Click Akun Demo
* **FR Terkait:** `FR-01` (Akses instan pengguna tanpa registrasi berbelit)
* **Endpoint:** `POST /api/auth/demo`
* **Request Body:** `{}` (Kosong)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr-demo-01",
      "fullName": "Uda Syukri (Owner Sanjai Ummi)",
      "email": "demo.sanjai@umkita.id"
    },
    "businessId": "biz-sanjai-01"
  }
}
```

---

### 1.2 Profil Usaha UMKM (Business Profile)
* **FR Terkait:** `FR-02` (Kelola profil usaha: nama, kategori, deskripsi, lokasi, target pasar)
* **Endpoint:** `GET /api/business` & `POST /api/business` (Upsert)
* **Request Body (`POST`):**
```json
{
  "businessName": "Keripik Balado Sanjai Ummi",
  "category": "kuliner",
  "subCategory": "Makanan Ringan & Oleh-oleh",
  "description": "Produsen oleh-oleh keripik singkong balado khas Bukittinggi asli sejak 1998.",
  "location": "Bukittinggi, Sumatera Barat",
  "targetAudience": "Wisatawan, perantau Minang, dan penikmat camilan pedas"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "biz-sanjai-01",
    "businessName": "Keripik Balado Sanjai Ummi",
    "category": "kuliner",
    "location": "Bukittinggi, Sumatera Barat",
    "updatedAt": "2026-11-07T10:00:00Z"
  }
}
```

---

### 1.3 Manajemen Katalog Produk (Products CRUD)
* **FR Terkait:** `FR-03` (Tambah, lihat, ubah, dan hapus menu makanan)

#### A. Ambil Semua Produk
* **Endpoint:** `GET /api/products`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod-sanjai-01",
      "name": "Keripik Balado Sanjai Ummi",
      "price": 25000,
      "category": "Makanan Ringan",
      "description": "Keripik singkong renyah dengan baluran cabai merah asli Bukittinggi.",
      "advantages": "Singkong renyah tanpa pengawet buatan, cabai merah segar Bukittinggi",
      "originalImageUrl": "https://storage.umkita.id/products/sanjai-raw.jpg",
      "isActive": true
    }
  ]
}
```

#### B. Tambah Produk Baru
* **Endpoint:** `POST /api/products`
* **Request Body:**
```json
{
  "name": "Rendang Daging Suwir Datuak",
  "price": 65000,
  "category": "Lauk Pauk Tradisional",
  "description": "Rendang daging sapi suwir dimasak 8 jam dengan rempah kelapa sangrai.",
  "advantages": "Empuk, bumbu hitam pekat khas Payakumbuh, tahan 3 bulan tanpa kulkas",
  "originalImageUrl": "https://storage.umkita.id/products/rendang-raw.jpg"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "prod-rendang-02",
    "name": "Rendang Daging Suwir Datuak",
    "price": 65000,
    "isActive": true
  }
}
```

#### C. Hapus Produk
* **Endpoint:** `DELETE /api/products/:id`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": { "message": "Produk berhasil dihapus" }
}
```

---

### 1.4 Brand Kit & Karakter Visual
* **FR Terkait:** `FR-04` (Atur logo, palet warna primer/sekunder, preset visual, tone komunikasi)
* **Endpoint:** `GET /api/brand-kit` & `PUT /api/brand-kit`
* **Request Body (`PUT`):**
```json
{
  "logoUrl": "/assets/logo.jpeg",
  "primaryColor": "#2563EB",
  "secondaryColor": "#F59E0B",
  "visualPreset": "rustic_minang",
  "toneOfVoice": "ramah_persuasif"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "businessId": "biz-sanjai-01",
    "primaryColor": "#2563EB",
    "secondaryColor": "#F59E0B",
    "visualPreset": "rustic_minang",
    "toneOfVoice": "ramah_persuasif",
    "updatedAt": "2026-11-07T10:15:00Z"
  }
}
```

---

# 🧠 MODUL 2: ASISTEN PEMASARAN (MARKETING ASSISTANT)
**Penanggung Jawab (PIC): FUAD**  
**Cakupan FR:** FR-05 s/d FR-08

---

### 2.1 Rekomendasi Strategi Pemasaran Cerdas
* **FR Terkait:** `FR-05`, `FR-06`, `FR-07`, `FR-08` (Pilih 4 tujuan kampanye & terima rekomendasi taktis)
* **Endpoint:** `POST /api/marketing/recommend`
* **Request Body:**
```json
{
  "goalType": "promo_diskon", // Nilai valid: "promo_diskon" | "product_launch" | "brand_awareness" | "edukasi_pelanggan"
  "targetProductId": "prod-sanjai-01" // Opsional, default memilih produk terpopuler
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "goalId": "goal-promo-01",
    "goalType": "promo_diskon",
    "campaignTitle": "Promo Payday Sanjai Gurih Akhir Pekan",
    "targetProduct": {
      "id": "prod-sanjai-01",
      "name": "Keripik Balado Sanjai Ummi",
      "price": 25000
    },
    "keyMessages": [
      "Sensasi pedas manis khas Bukittinggi bikin nagih!",
      "Diskon spesial hemat 20% khusus pemesanan hari ini"
    ],
    "suggestedFormat": "VIDEO_REEL",
    "recommendedPreset": "bold_promo"
  }
}
```

---

# 📅 MODUL 3: PERENCANA KONTEN 7 HARI (CONTENT PLANNER)
**Penanggung Jawab (PIC): FUAD**  
**Cakupan FR:** FR-09 s/d FR-12

---

### 3.1 Generate Jadwal Kalender 7 Hari Otomatis
* **FR Terkait:** `FR-09`, `FR-10` (Susun jadwal mingguan Senin-Minggu lengkap dengan topik & produk target)
* **Endpoint:** `POST /api/marketing/planner/generate`
* **Request Body:**
```json
{
  "goalId": "goal-promo-01"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "goalId": "goal-promo-01",
    "items": [
      {
        "id": "plan-day-1",
        "dayNumber": 1,
        "dayName": "Senin",
        "scheduledDate": "2026-11-09",
        "topic": "Spill Renyahnya Sanjai Balado Baru Matang",
        "contentType": "behind_the_scenes",
        "description": "Tampilkan proses penggorengan singkong dan wangi cabai merah asli Bukittinggi.",
        "recommendedProductId": "prod-sanjai-01",
        "status": "planned"
      },
      {
        "id": "plan-day-2",
        "dayNumber": 2,
        "dayName": "Selasa",
        "scheduledDate": "2026-11-10",
        "topic": "Flash Sale Hemat 20% Pengiriman Se-Indonesia",
        "contentType": "promo_offer",
        "description": "Fokus pada call-to-action diskon terbatas via WhatsApp.",
        "recommendedProductId": "prod-sanjai-01",
        "status": "planned"
      }
      // Hari 3 s/d 7 ...
    ]
  }
}
```

---

### 3.2 Ambil & Update Jadwal Konten
* **FR Terkait:** `FR-11` (Melihat dan mengedit topik rencana konten)
* **Endpoint 1:** `GET /api/marketing/planner` (Ambil jadwal aktif)
* **Endpoint 2:** `PUT /api/marketing/planner/:planItemId` (Edit topik/deskripsi)
* **Request Body (`PUT`):**
```json
{
  "topic": "Promo Jumat Berkah Gratis Ongkir Padang",
  "description": "Khusus pemesanan minimal 3 bungkus hari ini."
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": { "id": "plan-day-1", "topic": "Promo Jumat Berkah Gratis Ongkir Padang" }
}
```

---

### 3.3 Update Status Pelacakan Konten
* **FR Terkait:** `FR-12` (Ubah status: `planned` -> `generated` -> `published`)
* **Endpoint:** `PATCH /api/marketing/planner/:planItemId/status`
* **Request Body:**
```json
{
  "status": "generated" // Nilai valid: "planned" | "generated" | "published"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": { "id": "plan-day-1", "status": "generated" }
}
```

---

### 🔗 Jembatan Integrasi: Planner ke Studio (Client Dispatcher URL)
Saat pengguna menekan tombol *"Buat di Studio"* pada kartu hari kalender, Modul 3 cukup mengarahkan halaman ke:
```http
/studio?planId=plan-day-1&productId=prod-sanjai-01&goal=promo_diskon&topic=Flash+Sale+Hemat+20%25
```
Halaman `/studio` membaca query parameters via `useSearchParams()`.

---

# ⚡ MODUL 4: AI VISUAL & MOTION STUDIO
**Penanggung Jawab (PIC): FERDI**  
**Cakupan FR:** FR-13 s/d FR-21

> 💡 **ARSITEKTUR CLIENT-SIDE KHUSUS FERDI:**  
> Fitur **Background Removal WASM** (`FR-15`), **AI Color Harmony** (`FR-16`), **Komposisi Poster 1:1** (`FR-18`), dan **Motion Video Vertikal 9:16 Canvas 60 FPS** (`FR-19`) dieksekusi **100% di browser sisi klien**. Tidak membebani server backend dan zero GPU cost!

---

### 4.1 Generative Copywriting AI (Gemini 1.5 Flash)
* **FR Terkait:** `FR-20` (Hasilkan 2 opsi caption persuasif lengkap dengan tagar lokal)
* **Endpoint:** `POST /api/ai/copywrite`
* **Request Body:**
```json
{
  "productName": "Keripik Balado Sanjai Ummi",
  "advantages": "Singkong renyah tanpa pengawet dengan baluran cabai merah asli Bukittinggi",
  "goalType": "promo_diskon",
  "style": "storytelling" // Nilai valid: "storytelling" | "hard-sell"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hook": "Sensasi pedas manis khas Minangkabau yang bikin ketagihan! 🌶️✨",
    "caption": "Keripik Balado Sanjai Ummi diolah dari singkong pilihan dengan baluran cabai merah asli Bukittinggi yang kaya rempah. Renyahnya juara!",
    "callToAction": "Pesan sekarang via link bio untuk promo terbatas hemat 20%!",
    "hashtags": ["#SanjaiUmmi", "#KulinerMinang", "#OlehOlehPadang", "#UMKita"],
    "isFallback": false // Bernilai true jika perangkat offline dan memakai template cadangan lokal
  }
}
```

---

### 4.2 Simpan Hasil Desain ke Database
* **FR Terkait:** `FR-21` (Simpan riwayat poster / video yang baru saja diekspor)
* **Endpoint:** `POST /api/marketing/contents`
* **Request Body:**
```json
{
  "productId": "prod-sanjai-01",
  "contentPlanId": "plan-day-1", // Opsional
  "format": "VIDEO_REEL", // Nilai valid: "POSTER" | "VIDEO_REEL"
  "templateId": "rustic_minang",
  "finalMediaUrl": "https://storage.umkita.id/rendered/video-sanjai-01.webm", // Atau string base64 / blob URL lokal
  "caption": "Sensasi pedas manis khas Minangkabau...",
  "hashtags": ["#SanjaiUmmi", "#KulinerMinang"]
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "contentId": "cnt-001",
    "savedAt": "2026-11-07T11:00:00Z"
  }
}
```

---

# 📂 MODUL 5: GALERI ASET & RIWAYAT PROMOSI
**Penanggung Jawab (PIC): FERDI**  
**Cakupan FR:** FR-22 s/d FR-25

---

### 5.1 Ambil Riwayat Galeri Desain
* **FR Terkait:** `FR-22`, `FR-23` (Menampilkan seluruh poster dan video yang pernah dibuat)
* **Endpoint:** `GET /api/history`
* **Query Parameter (Opsional):** `?format=POSTER` atau `?format=VIDEO_REEL`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cnt-001",
      "productName": "Keripik Balado Sanjai Ummi",
      "format": "VIDEO_REEL",
      "templateId": "rustic_minang",
      "finalMediaUrl": "https://storage.umkita.id/rendered/video-sanjai-01.webm",
      "caption": "Sensasi pedas manis khas Minangkabau...",
      "createdAt": "2026-11-07T11:00:00Z",
      "activity": {
        "publicationStatus": "published",
        "inquiryCount": 8,
        "orderCount": 3
      }
    }
  ]
}
```

---

### 5.2 Catat Hasil Performa Promosi Manual
* **FR Terkait:** `FR-25` (UMKM mencatat jumlah chat dan pesanan masuk secara mandiri)
* **Endpoint:** `PATCH /api/history/:contentId/activity`
* **Request Body:**
```json
{
  "publicationStatus": "published",
  "targetChannel": "instagram_reels",
  "inquiryCount": 12,
  "orderCount": 5,
  "notes": "Video Reels ramai ditonton jam makan siang!"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": { "message": "Catatan performa promosi berhasil disimpan" }
}
```

---

### 📱 Distribusi 1-Klik (FR-24 Web Share API)
Untuk fitur 1-Click Share ke WhatsApp atau Instagram Stories, dieksekusi di sisi browser menggunakan Web API native:
```typescript
if (navigator.share) {
  navigator.share({
    title: 'Promosi Keripik Balado Sanjai Ummi',
    text: `${caption}\n\n${hashtags.join(' ')}`,
    url: window.location.href
  });
}
```

---

## 🛡️ Standar Error Codes & Fallback Lintas Modul (FR-26 s/d FR-28)
| Kode Error | HTTP Status | Kapan Terjadi | Solusi / Fallback Sistem |
| :--- | :---: | :--- | :--- |
| `VALIDATION_ERROR` | `400` | Input form nama produk / harga tidak lengkap | Tampilkan alert merah empuk pada input yang bermasalah |
| `NOT_FOUND` | `404` | Data produk atau jadwal tidak ditemukan | Tampilkan ilustrasi ramah "Data Belum Tersedia" |
| `AI_OFFLINE_FALLBACK` | `200` | Koneksi API Gemini terputus / offline | Sistem otomatis beralih ke template teks modular lokal |
| `WASM_CV_FALLBACK` | Client | Browser gagal memuat model Transformers.js | Sistem otomatis menggunakan foto asli dengan bingkai elegan |
