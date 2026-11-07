import { NextRequest, NextResponse } from "next/server";
import { checkComfyUiStatus } from "@/lib/comfyui";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const serverUrl = searchParams.get("serverUrl") || process.env.COMFYUI_SERVER_URL || "http://127.0.0.1:8188";

  const status = await checkComfyUiStatus(serverUrl);
  return NextResponse.json(status);
}

