import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateVideoSchema = z.object({
  title: z.string().min(2).optional(),
  youtubeUrl: z.string().url().optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  order: z.number().optional(),
  commentsEnabled: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const { videoId } = await params;
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        module: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
        _count: { select: { comments: true, mcqQuestions: true } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ data: video });
  } catch (error) {
    console.error("Get video error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { videoId } = await params;
    const body = await req.json();
    const validation = updateVideoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const video = await prisma.video.update({
      where: { id: videoId },
      data: validation.data,
    });

    await prisma.adminActivity.create({
      data: {
        action: "UPDATE_VIDEO",
        details: `Updated video: ${video.title}`,
        adminId: session.user.id,
        targetId: videoId,
      },
    });

    return NextResponse.json({ data: video });
  } catch (error) {
    console.error("Update video error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { videoId } = await params;
    await prisma.video.delete({ where: { id: videoId } });

    return NextResponse.json({ message: "Video deleted" });
  } catch (error) {
    console.error("Delete video error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
