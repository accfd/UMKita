export interface SanjaiProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  advantages: string;
  originalImageUrl: string;
  badge: string;
  isActive: boolean;
}

export const SANJAI_NAFAMA_BUSINESS = {
  id: "biz-sanjai-nafama",
  name: "Sanjai Nafama",
  ownerName: "Uni Maya & Keluarga Nafama",
  handle: "@sanjainafama_padang.ganting",
  instagramUrl: "https://www.instagram.com/sanjainafama_padang.ganting/",
  location: "Padang Ganting, Kab. Tanah Datar, Sumatera Barat",
  category: "Oleh-oleh Khas Minangkabau & Olahan Singkong",
  bio: "Keripik Sanjai Balado asli olahan tangan khas Padang Ganting. Renyah, gurih, bumbu melimpah tanpa pengawet. Siap kirim ke seluruh nusantara! 🌶️✨",
  followersCount: 1420,
  postsCount: 58,
  whatsapp: "+6281267894521"
};

export const SANJAI_NAFAMA_PRODUCTS: SanjaiProduct[] = [
  {
    id: "prod-sanjai-tawar",
    name: "Keripik Sanjai Tawar / Original",
    price: 22000,
    category: "Keripik Singkong",
    description: "Keripik singkong putih tipis renyah rasa original/tawar khas Padang Ganting, gurih alami tanpa cabai.",
    advantages: "Singkong renyah empuk, bebas pengawet, rasa gurih original murni",
    originalImageUrl: "/produk/produk1.jpeg",
    badge: "Original",
    isActive: true
  },
  {
    id: "prod-karak-kaliang",
    name: "Karak Kaliang / Angka Delapan",
    price: 18000,
    category: "Kerupuk Tradisional",
    description: "Kerupuk singkong legendaris khas Minangkabau berbentuk angka 8 berwarna kuning kunyit gurih renyah.",
    advantages: "Bentuk angka 8 khas, aroma kunyit & bawang gurih, camilan favorit perantau",
    originalImageUrl: "/produk/produk2.jpg",
    badge: "Khas Minang",
    isActive: true
  },
  {
    id: "prod-sanjai-balado",
    name: "Keripik Sanjai Balado Merah",
    price: 25000,
    category: "Keripik Singkong",
    description: "Keripik singkong bulat renyah berbalur sambal balado merah pedas manis gurih olahan tangan asli.",
    advantages: "Baluran cabai merah asli mengkilap, pedas manis legit, renyah tahan lama",
    originalImageUrl: "/produk/produk3.jpg",
    badge: "Bintang Toko",
    isActive: true
  },
  {
    id: "prod-sanjai-stik",
    name: "Keripik Sanjai Balado Panjang (Stik)",
    price: 25000,
    category: "Keripik Singkong",
    description: "Keripik singkong potongan memanjang stik tebal renyah dengan baluran bumbu balado merah melimpah.",
    advantages: "Potongan stik tebal dan renyah, sensasi bumbu balado meresap, mantap dikunyah",
    originalImageUrl: "/produk/produk4.jpg",
    badge: "Favorit",
    isActive: true
  },
  {
    id: "prod-dakak-dakak",
    name: "Dakak-Dakak Gurih Kuning",
    price: 18000,
    category: "Camilan Khas",
    description: "Camilan kubus dadu singkong renyah khas Minangkabau beraroma rempah kunyit dan taburan daun seledri.",
    advantages: "Tekstur dadu renyah kriuk, wangi seledri dan kunyit khas, oleh-oleh legendaris",
    originalImageUrl: "/produk/produk5.jpg",
    badge: "Tradisional",
    isActive: true
  }
];

export const SANJAI_NAFAMA_FEEDS = [
  {
    id: "feed-1",
    imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80",
    caption: "Aroma balado baru masak dari kuali dapur Nafama Padang Ganting! Siap kirim orderan hari ini 🌶️🔥 #sanjainafama #padangganting #oleholehminang",
    likes: 184,
    comments: 19,
    date: "2 hari lalu"
  },
  {
    id: "feed-2",
    imageUrl: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80",
    caption: "Karak Kaliang angka delapan kuning gurih kunyit, teman setia minum kopi kawa daun sore hari ☕ #kulinerpadang #oleholehsumbar",
    likes: 142,
    comments: 11,
    date: "4 hari lalu"
  },
  {
    id: "feed-3",
    imageUrl: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80",
    caption: "Singkong pilihan dari lereng bukit Tanah Datar. Dipotong tipis langsung digoreng garing di dapur Sanjai Nafama 🌾",
    likes: 226,
    comments: 34,
    date: "1 minggu lalu"
  }
];

export const MARKETING_GOAL_TYPES = [
  {
    id: "promo_diskon",
    title: "Promo Diskon & Penjualan Cepat",
    description: "Dorong pembelian kilat dengan diskon akhir pekan, paket combo, atau gratis ongkir.",
    recommendedFormat: "VIDEO_REEL",
    badge: "Penjualan Cepat",
    tagline: "Cocok untuk tingkatkan omzet mingguan"
  },
  {
    id: "product_launch",
    title: "Peluncuran Produk / Kemasan Baru",
    description: "Bangun rasa penasaran pelanggan dan perkenalkan varian produk atau kemasan baru tokomu.",
    recommendedFormat: "VIDEO_REEL",
    badge: "Peluncuran",
    tagline: "Ciptakan antusiasme dan pesanan perdana"
  },
  {
    id: "brand_awareness",
    title: "Kenalkan Usaha & Cerita Dapur",
    description: "Tampilkan dedikasi dapur, tradisi lokal Padang Ganting, dan jaminan keaslian tanpa pengawet.",
    recommendedFormat: "POSTER",
    badge: "Cerita Brand",
    tagline: "Bangun kepercayaan & hubungan emosional"
  },
  {
    id: "edukasi_pelanggan",
    title: "Edukasi Rasa & Tips Menikmati",
    description: "Bagikan cara simpan keripik agar tahan lama, rekomendasi teman minum kopi, dan asal-usul produk.",
    recommendedFormat: "CAROUSEL",
    badge: "Edukasi & Tips",
    tagline: "Edukasi pembeli agar jadi pelanggan setia"
  }
];
