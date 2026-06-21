import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createMCQSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.number().min(0),
  explanation: z.string().optional().nullable(),
  videoId: z.string(),
  order: z.number().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const status = searchParams.get("status");

    const where: Prisma.MCQQuestionWhereInput = {};
    if (videoId) where.videoId = videoId;
    if (status) where.status = status as "DRAFT" | "PUBLISHED";

    const questions = await prisma.mCQQuestion.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        video: { select: { id: true, title: true } },
        submissions: session?.user?.id
          ? { where: { userId: session.user.id }, select: { selectedAnswer: true, isCorrect: true } }
          : false,
      },
    });

    return NextResponse.json({ data: questions });
  } catch (error) {
    console.error("Get MCQs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const validation = createMCQSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const maxOrder = await prisma.mCQQuestion.findFirst({
      where: { videoId: validation.data.videoId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const question = await prisma.mCQQuestion.create({
      data: { ...validation.data, status: "DRAFT", order: (maxOrder?.order ?? -1) + 1 },
    });

    return NextResponse.json({ data: question }, { status: 201 });
  } catch (error) {
    console.error("Create MCQ error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
