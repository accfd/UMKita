/**
 * ComfyUI Client & Pipeline Integration for UMKita
 * Menggantikan Cloud AI API (Gemini / OpenAI) dengan Local ComfyUI Instance (Bebas Kuota & Mandiri)
 */

export interface ComfyUiGenerateOptions {
  serverUrl?: string; // Default: http://127.0.0.1:8188
  productImageBase64: string;
  productName: string;
  headline?: string;
  presetStyle?: string;
  price?: string | number;
  format?: "feed" | "story";
  checkpointModel?: string;
}

export interface ComfyUiStatus {
  online: boolean;
  serverUrl: string;
  devices?: any[];
  vramTotal?: number;
  vramFree?: number;
}

const DEFAULT_SERVER_URL = process.env.COMFYUI_SERVER_URL || "http://127.0.0.1:8188";

/**
 * Cek apakah server ComfyUI sedang aktif di mesin lokal / remote
 */
export async function checkComfyUiStatus(serverUrl = DEFAULT_SERVER_URL): Promise<ComfyUiStatus> {
  const cleanUrl = serverUrl.replace(/\/+$/, "");
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${cleanUrl}/system_stats`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const devices = data.devices || [];
      const primaryGpu = devices.find((d: any) => d.type === "cuda") || devices[0];

      return {
        online: true,
        serverUrl: cleanUrl,
        devices,
        vramTotal: primaryGpu?.vram_total,
        vramFree: primaryGpu?.vram_free,
      };
    }
  } catch (err) {
    // Server belum aktif / offline
  }

  return {
    online: false,
    serverUrl: cleanUrl,
  };
}

/**
 * Unggah gambar produk ke endpoint input ComfyUI
 */
export async function uploadImageToComfyUi(
  serverUrl: string,
  imageBuffer: Buffer,
  filename = "product_input.png"
): Promise<string> {
  const cleanUrl = serverUrl.replace(/\/+$/, "");
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/png" });
  formData.append("image", blob, filename);
  formData.append("overwrite", "true");

  const res = await fetch(`${cleanUrl}/upload/image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Gagal mengunggah foto produk ke ComfyUI: HTTP ${res.status}`);
  }

  const result = await res.json();
  return result.name || filename;
}

/**
 * Bangun node graph img2img dari komposisi yang sudah diarahkan. Ini mencegah
 * model membuat restoran / makanan acak dan hanya menyatukan cahaya/material.
 */
export function buildComfyUiWorkflow(
  uploadedFilename: string,
  productName: string,
  presetStyle = "tradisional",
  checkpointName = "Realistic_Vision_V6.0_B1.safetensors",
  format: "feed" | "story" = "feed"
) {
  // 512px cukup aman untuk RTX 3050 6GB.
  const width = 512;
  const height = format === "story" ? 896 : 640;

  const stylePrompts: Record<string, string> = {
    tradisional: "Indonesian Minang heritage art direction: dark mahogany wall and tabletop, one restrained red-and-gold songket corner accent, antique gold rim light, spice-red accent, asymmetrical editorial negative space, authentic warm cultural atmosphere",
    klasik: "vintage 1950s Indonesian trade advertisement art direction: aged warm paper backdrop, coffee-brown ink, thin classic border, soft sepia lighting, subtle print grain, empty central product stage, no modern props",
    modern: "contemporary youthful product studio: sky-blue seamless cyclorama, a single rounded pale-blue pedestal on the right, amber accent sphere in a far corner, soft clay-like shadows, generous white space, crisp bright commercial lighting",
    minimalis: "clean premium minimalist product studio: pure off-white and soft-gray architectural planes, one subtle light-gray pedestal, natural softbox lighting, nearly empty scene, hygienic and refined, generous negative space",
    ceria: "bold Indonesian promo studio: saturated bright-red backdrop with one oversized yellow comic sunburst in a far corner, dynamic diagonal composition, high contrast, energetic but uncluttered, strong clean product placement zone",
    natural: "organic earthy product photography: warm cream linen surface, soft daylight from the upper left, one small sage-green leaf cluster at a far corner, natural wood detail, calm eco-friendly mood, uncluttered composition",
  };

  const stylePrompt = stylePrompts[presetStyle] || stylePrompts.tradisional;
  const positivePrompt = `Refine this empty Indonesian UMKM advertising stage into a cohesive premium commercial background. Preserve its exact composition, colors, clear lower-right product placement area and upper-left typography-free area. ${stylePrompt}. Improve only lighting, subtle material realism, depth and color harmony. Do not add any object or food.`;
  const negativePrompt = `product, package, packaging, bag, label, logo, text, letters, watermark, restaurant, chair, table setting, plate, bowl, cutlery, noodles, chicken, meat, rice, cooked dish, crumbs, leaf, flower, person, hand, clutter, blurry, low quality, collage, split screen`;

  // Standard API Prompt Node Graph ComfyUI (SD 1.5 / SDXL compatible)
  return {
    "1": {
      inputs: {
        ckpt_name: checkpointName,
      },
      class_type: "CheckpointLoaderSimple",
    },
    "2": {
      inputs: { image: uploadedFilename },
      class_type: "LoadImage",
    },
    "3": {
      inputs: { upscale_method: "lanczos", width, height, crop: "center", image: ["2", 0] },
      class_type: "ImageScale",
    },
    "4": {
      inputs: { pixels: ["3", 0], vae: ["1", 2] },
      class_type: "VAEEncode",
    },
    "5": {
      inputs: {
        text: positivePrompt,
        clip: ["1", 1],
      },
      class_type: "CLIPTextEncode",
    },
    "6": {
      inputs: {
        text: negativePrompt,
        clip: ["1", 1],
      },
      class_type: "CLIPTextEncode",
    },
    "7": {
      inputs: {
        seed: Math.floor(Math.random() * 1000000000),
        steps: 22,
        cfg: 6.5,
        sampler_name: "dpmpp_2m",
        scheduler: "karras",
        denoise: 0.16,
        model: ["1", 0],
        positive: ["5", 0],
        negative: ["6", 0],
        latent_image: ["4", 0],
      },
      class_type: "KSampler",
    },
    "8": {
      inputs: {
        samples: ["7", 0],
        vae: ["1", 2],
      },
      class_type: "VAEDecode",
    },
    "9": {
      inputs: {
        filename_prefix: `UMKita_${presetStyle}`,
        images: ["8", 0],
      },
      class_type: "SaveImage",
    },
  };
}

/**
 * Jalankan generasi poster dengan ComfyUI API
 */
export async function generatePosterWithComfyUi(
  options: ComfyUiGenerateOptions
): Promise<{ success: boolean; imageBase64?: string; promptUsed?: string; error?: string }> {
  const serverUrl = (options.serverUrl || DEFAULT_SERVER_URL).replace(/\/+$/, "");

  // 1. Cek status ComfyUI
  const status = await checkComfyUiStatus(serverUrl);
  if (!status.online) {
    return {
      success: false,
      error: `Server ComfyUI tidak dapat dihubungi di ${serverUrl}. Pastikan ComfyUI sudah dijalankan di komputermu.`,
    };
  }

  try {
    // 2. Ekstrak buffer foto produk
    const base64Data = options.productImageBase64.includes("base64,")
      ? options.productImageBase64.split("base64,")[1]
      : options.productImageBase64;
    const imageBuffer = Buffer.from(base64Data, "base64");

    // 3. Upload reference stage yang sudah dikomposisikan agar AI tidak bebas
    // mengarang tata letak dan properti yang tidak relevan.
    const uploadedName = await uploadImageToComfyUi(
      serverUrl,
      imageBuffer,
      `umkita-stage-${Date.now()}.png`
    );
    const promptGraph = buildComfyUiWorkflow(
      uploadedName,
      options.productName,
      options.presetStyle,
      options.checkpointModel || "Realistic_Vision_V6.0_B1.safetensors",
      options.format || "feed"
    );

    const clientId = `umkita_${Date.now()}`;

    // 4. Kirim antrian prompt ke ComfyUI
    const promptRes = await fetch(`${serverUrl}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: promptGraph,
        client_id: clientId,
      }),
    });

    if (!promptRes.ok) {
      const errText = await promptRes.text();
      throw new Error(`ComfyUI /prompt error: ${errText}`);
    }

    const { prompt_id } = await promptRes.json();

    // 5. Polling riwayat eksekusi (hingga selesai, maks 2 menit)
    let outputFilename = "";
    let outputSubfolder = "";
    const maxPollAttempts = 60; // 60 x 2 detik = 2 menit

    for (let i = 0; i < maxPollAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const historyRes = await fetch(`${serverUrl}/history/${prompt_id}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const runData = historyData[prompt_id];
        if (runData && runData.outputs) {
          // Cari output dari SaveImage node
          for (const nodeId of Object.keys(runData.outputs)) {
            const nodeOut = runData.outputs[nodeId];
            if (nodeOut.images && nodeOut.images.length > 0) {
              outputFilename = nodeOut.images[0].filename;
              outputSubfolder = nodeOut.images[0].subfolder || "";
              break;
            }
          }
          if (outputFilename) break;
        }
      }
    }

    if (!outputFilename) {
      throw new Error("ComfyUI membutuhkan waktu lebih lama atau eksekusi prompt gagal.");
    }

    // 6. Unduh hasil citra akhir dari ComfyUI
    const viewUrl = `${serverUrl}/view?filename=${encodeURIComponent(outputFilename)}&subfolder=${encodeURIComponent(outputSubfolder)}&type=output`;
    const viewRes = await fetch(viewUrl);
    if (!viewRes.ok) {
      throw new Error(`Gagal mengunduh gambar hasil ComfyUI: HTTP ${viewRes.status}`);
    }

    const contentType = viewRes.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      throw new Error("ComfyUI mengembalikan respons non-gambar. Poster akan dibuat memakai kompositor lokal.");
    }

    const outputBuffer = Buffer.from(await viewRes.arrayBuffer());
    const finalBase64 = `data:image/png;base64,${outputBuffer.toString("base64")}`;

    return {
      success: true,
      imageBase64: finalBase64,
      promptUsed: promptGraph["5"].inputs.text,
    };
  } catch (err: any) {
    console.error("[ComfyUI Generation Error]:", err);
    return {
      success: false,
      error: err.message || "Gagal menghasilkan gambar poster dari ComfyUI.",
    };
  }
}
