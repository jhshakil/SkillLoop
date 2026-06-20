import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createNoteSchema = z.object({
  content: z.string().min(1),
  videoId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const courseId = searchParams.get("courseId");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    if (videoId) {
      const note = await prisma.note.findUnique({
        where: { userId_videoId: { userId: session.user.id, videoId } },
      });
      return NextResponse.json({ data: note });
    }

    const where: Prisma.NoteWhereInput = { userId: session.user.id };

    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }

    if (courseId) {
      where.video = {
        module: { courseId },
      };
    }

    const orderBy: Prisma.NoteOrderByWithRelationInput = sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              module: {
                select: {
                  id: true,
                  title: true,
                  course: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
      }),
      prisma.note.count({ where }),
    ]);

    return NextResponse.json({
      data: notes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get notes error:", error);
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
    const validation = createNoteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const note = await prisma.note.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: validation.data.videoId,
        },
      },
      update: { content: validation.data.content },
      create: {
        content: validation.data.content,
        userId: session.user.id,
        videoId: validation.data.videoId,
      },
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
