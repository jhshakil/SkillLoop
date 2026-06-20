import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createVideoSchema = z.object({
  title: z.string().min(2),
  youtubeUrl: z.string().url().refine((url) => {
    const patterns = [/youtube\.com\/watch\?v=/, /youtu\.be\//, /youtube\.com\/embed\//, /youtube\.com\/shorts\//];
    return patterns.some((p) => p.test(url));
  }, "Invalid YouTube URL"),
  description: z.string().optional().nullable(),
  moduleId: z.string(),
  commentsEnabled: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = createVideoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
    }

    const maxOrder = await prisma.video.findFirst({
      where: { moduleId: validation.data.moduleId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrder?.order ?? -1) + 1;

    const video = await prisma.video.create({
      data: {
        title: validation.data.title,
        youtubeUrl: validation.data.youtubeUrl,
        description: validation.data.description,
        moduleId: validation.data.moduleId,
        commentsEnabled: validation.data.commentsEnabled,
        order: newOrder,
      },
    });

    const moduleData = await prisma.module.findUnique({
      where: { id: video.moduleId },
      select: { courseId: true, title: true },
    });

    await prisma.adminActivity.create({
      data: {
        action: "ADD_VIDEO",
        details: `Added video "${video.title}" to module "${moduleData?.title}"`,
        adminId: session.user.id,
        targetId: video.id,
      },
    });

    return NextResponse.json({ data: video }, { status: 201 });
  } catch (error) {
    console.error("Create video error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
