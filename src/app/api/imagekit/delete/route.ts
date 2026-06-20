import { NextRequest, NextResponse } from "next/server";
import { deleteImageKitFile } from "@/lib/imagekit";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    await deleteImageKitFile(imageUrl);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ImageKit delete error:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
