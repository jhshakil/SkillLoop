import { NextResponse } from "next/server";
import { getImageKitAuthParams } from "@/lib/imagekit";

export async function GET() {
  try {
    const authParams = getImageKitAuthParams();
    return NextResponse.json(authParams);
  } catch (error) {
    console.error("ImageKit auth error:", error);
    return NextResponse.json({ error: "Failed to get auth params" }, { status: 500 });
  }
}
