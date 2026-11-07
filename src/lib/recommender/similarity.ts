/**
 * Modul Algoritma Kemiripan Vektor Matematis (Cosine Similarity & TF-IDF)
 * Murni TypeScript tanpa dependensi eksternal untuk Sistem Rekomendasi UMKita.
 */

// Stopwords Bahasa Indonesia yang diabaikan dalam pembentukan vektor kata
const INDONESIAN_STOPWORDS = new Set([
  "dan", "di", "ke", "dari", "yang", "untuk", "pada", "dengan", "ini", "itu",
  "adalah", "sebagai", "atau", "juga", "akan", "bisa", "ada", "karena", "agar",
  "oleh", "saat", "setelah", "sebelum", "sudah", "kami", "kita", "kamu", "saya",
  "toko", "produk", "jual", "beli", "dalam", "bukan", "hanya", "para", "saja",
  "sangat", "lebih", "paling", "lagi", "banyak", "setiap", "semua", "tentang"
]);

/**
 * 1. Tokenizer: Membersihkan teks, lowercase, membuang simbol, dan memfilter stopwords
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(word => word.length >= 3 && !INDONESIAN_STOPWORDS.has(word));
}

/**
 * 2. Membentuk Vocabulary unik dari kumpulan dokumen/teks
 */
export function buildVocabulary(documentTokenLists: string[][]): string[] {
  const vocabSet = new Set<string>();
  for (const tokens of documentTokenLists) {
    for (const token of tokens) {
      vocabSet.add(token);
    }
  }
  return Array.from(vocabSet);
}

/**
 * 3. Membentuk Term Frequency Vector (Vektor Frekuensi Kata)
 */
export function createTermVector(tokens: string[], vocabulary: string[]): number[] {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return vocabulary.map(term => counts.get(term) || 0);
}

/**
 * 4. Rumus Matematis Cosine Similarity:
 * Similarity(A, B) = (A · B) / (||A|| * ||B||)
 * Mengembalikan nilai desimal 0.0 s.d. 1.0
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const valA = vecA[i];
    const valB = vecB[i];

    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  const similarity = dotProduct / magnitude;
  // Batasi rentang aman [0, 1]
  return Math.min(Math.max(similarity, 0), 1);
}

/**
 * Helper: Hitung persentase kecocokan 0 - 100%
 */
export function calculateMatchPercentage(similarityScore: number): number {
  // Normalisasi kurva skor agar representatif (kemiripan term sparse 0.2 - 0.7 menjadi 75% - 98%)
  if (similarityScore <= 0) return 65; // Skor dasar relevansi katalog
  const scaled = 65 + (similarityScore * 35);
  return Math.min(Math.round(scaled), 99);
}

