import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1),
  videoId: z.string(),
  parentId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { videoId, parentId: null },
        include: {
          user: { select: { id: true, name: true, image: true, role: true } },
          replies: {
            include: {
              user: { select: { id: true, name: true, image: true, role: true } },
              replies: {
                include: {
                  user: { select: { id: true, name: true, image: true, role: true } },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.comment.count({ where: { videoId, parentId: null } }),
    ]);

    return NextResponse.json({
      data: comments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = createCommentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const video = await prisma.video.findUnique({ where: { id: validation.data.videoId } });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!video.commentsEnabled) {
      return NextResponse.json({ error: "Comments are disabled for this video" }, { status: 403 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: validation.data.content,
        videoId: validation.data.videoId,
        userId: session.user.id,
        parentId: validation.data.parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    const parentComment = validation.data.parentId
      ? await prisma.comment.findUnique({
          where: { id: validation.data.parentId },
          select: { userId: true, content: true },
        })
      : null;

    const moduleData = await prisma.module.findUnique({
      where: { id: video.moduleId },
      select: { courseId: true, title: true },
    });

    const adminsAndMods = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MODERATOR"] } },
      select: { id: true },
    });

    const notificationPromises = adminsAndMods.map((u) =>
      prisma.notification.create({
        data: {
          message: parentComment
            ? `Reply on comment: "${parentComment.content.slice(0, 50)}..."`
            : `New comment on video: "${video.title}"`,
          type: "COMMENT",
          link: `/admin/courses/${moduleData?.courseId}/modules/${video.moduleId}/videos/${video.id}`,
          userId: u.id,
        },
      })
    );

    await Promise.all(notificationPromises);

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
