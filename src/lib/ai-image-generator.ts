/**
 * Generative product-poster engine.
 *
 * The uploaded photo is supplied to the image-edit endpoint as a reference. This
 * is deliberately different from text-to-image generation: it tells the model
 * which real product and packaging must be retained in the finished campaign.
 */

export type AiImageModel = "gemini-2.5-flash-image" | "gpt-image-2.6-sunburst" | "gpt-image-2.6-flare";

export interface GenerateAiPosterInput {
  productName: string;
  headline?: string;
  brandName?: string;
  presetStyle?: string;
  price?: string | number;
  format?: "feed" | "story";
  uploadedImageBase64?: string;
  referenceImageBase64?: string;
  aiModel?: AiImageModel;
  apiKey?: string;
}

export interface GenerateAiPosterOutput {
  success: boolean;
  imageBase64: string;
  source: AiImageModel;
  promptUsed: string;
}

const STYLE_DIRECTIONS: Record<string, string> = {
  tradisional:
    "luxury Minangkabau food campaign: warm dark teak table, restrained red-and-gold songket details, rattan and subtle spice props, warm editorial studio lighting",
  klasik:
    "refined nostalgic Indonesian food campaign: sepia paper texture, restrained antique brass and wooden props, premium editorial lighting, never a distressed or cluttered layout",
  modern:
    "bright contemporary commercial food campaign: sculptural pastel podium, clean geometric shapes, energetic but spacious composition, soft premium studio lighting",
  minimalis:
    "premium minimalist food campaign: neutral stone plinth, soft daylight, generous negative space, subtle botanical shadow, quiet luxury art direction",
  ceria:
    "bold joyful snack campaign: vibrant chili-red and mango-yellow colour blocking, dynamic but polished product photography, controlled confetti-like snack accents",
  natural:
    "organic food campaign: bamboo, linen, fresh lime leaves and natural ingredients, earthy palette, soft window light, elegant sustainable styling",
};

function normaliseStyle(style?: string): string {
  const value = (style || "tradisional").toLowerCase();
  if (value === "rustic_minang") return "tradisional";
  if (value === "vintage" || value === "nostalgia_vintage") return "klasik";
  if (value === "claymorphism") return "modern";
  if (value === "clean" || value === "editorial") return "minimalis";
  if (value === "bold_promo" || value === "bold_punch_promo") return "ceria";
  return value;
}

/** Build a reference-preserving art-direction prompt for a single product shot. */
export function buildFoodPosterPrompt(input: GenerateAiPosterInput): string {
  const product = input.productName || "produk UMKM";
  const brand = input.brandName || "brand UMKM Indonesia";
  const headline = input.headline || "Camilan Renyah Khas Minang";
  const style = STYLE_DIRECTIONS[normaliseStyle(input.presetStyle)] || STYLE_DIRECTIONS.tradisional;
  const orientation = input.format === "story" ? "vertical 9:16" : "square 1:1";

  return `Create a ${orientation} premium commercial product poster for ${brand}, featuring ${product}.

Image 1 is the real product photograph and is the source of truth. Preserve the exact package, label, logo, colours, product shape, material, and readable text from Image 1. Do not replace, redraw, crop, simplify, invent, or obscure the package. Place that exact product as the clear hero in the lower-right or lower-centre third at realistic scale, with a physically believable contact shadow and reflections that match the scene.

Art direction: ${style}. Create a complete, cohesive advertising photograph with depth, foreground and background separation, prop styling relevant to the food, premium food-magazine lighting, and an intentional visual hierarchy. Include a wooden bowl of the actual snack in the lower-left foreground and leave a warm, uncluttered upper-left area for the headline.

Typography must be large, highly legible, and exactly spell these three lines: brand "${brand}" in a small top-left mark, product name "${product}" as the large headline, and subtitle "${headline}" below it. Do not add other slogans, labels, price tags, watermarks, UI cards, or unreadable pseudo-text. Do not duplicate the product or packaging. No collage, no flat template, no pasted-cutout appearance. The result must look like a professional Indonesian FMCG campaign photographed in one coherent scene.`;
}

function asDataUrl(base64: string): string {
  return base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
}

async function generateWithOpenAi(
  input: GenerateAiPosterInput,
  prompt: string,
  apiKey: string
): Promise<string | null> {
  const reference = input.referenceImageBase64 || input.uploadedImageBase64;
  if (!reference) return null;

  const model = input.aiModel || "gpt-image-2.6-sunburst";
  const size = input.format === "story" ? "1024x1536" : "1024x1024";
  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      images: [{ image_url: asDataUrl(reference) }],
      prompt,
      size,
      quality: model === "gpt-image-2.6-sunburst" ? "max" : "high",
      complexity: "high",
      output_format: "png",
    }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "OpenAI image edit gagal diproses.");

  const item = payload?.data?.[0];
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item?.url) {
    const imageResponse = await fetch(item.url);
    if (!imageResponse.ok) throw new Error("Gagal mengambil hasil gambar dari OpenAI.");
    return `data:image/png;base64,${Buffer.from(await imageResponse.arrayBuffer()).toString("base64")}`;
  }
  return null;
}

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const [metadata, data] = asDataUrl(dataUrl).split(",", 2);
  const mimeType = metadata.match(/^data:([^;]+);base64$/)?.[1] || "image/png";
  return { mimeType, data };
}

async function generateWithGemini(
  input: GenerateAiPosterInput,
  prompt: string,
  apiKey: string
): Promise<string | null> {
  const reference = input.referenceImageBase64 || input.uploadedImageBase64;
  if (!reference) return null;
  const image = splitDataUrl(reference);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: prompt }, { inlineData: image }],
        }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: input.format === "story" ? "9:16" : "1:1", imageSize: "1K" },
        },
      }),
    }
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "Gemini image edit gagal diproses.");
  const inlineData = payload?.candidates?.[0]?.content?.parts?.find((part: { inlineData?: unknown }) => part.inlineData)?.inlineData;
  if (!inlineData?.data) return null;
  return `data:${inlineData.mimeType || "image/png"};base64,${inlineData.data}`;
}

export async function generateAiPoster(input: GenerateAiPosterInput): Promise<GenerateAiPosterOutput> {
  const prompt = buildFoodPosterPrompt(input);
  const model = input.aiModel || "gemini-2.5-flash-image";
  const isGemini = model === "gemini-2.5-flash-image";
  const apiKey = isGemini
    ? process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    : input.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) throw new Error(isGemini ? "GEMINI_API_KEY_REQUIRED" : "OPENAI_API_KEY_REQUIRED");
  const imageBase64 = isGemini
    ? await generateWithGemini(input, prompt, apiKey)
    : await generateWithOpenAi(input, prompt, apiKey);
  if (!imageBase64) throw new Error(`${isGemini ? "Gemini" : "OpenAI"} tidak mengembalikan gambar poster.`);
  return { success: true, imageBase64, source: model, promptUsed: prompt };
}
