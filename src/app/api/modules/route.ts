import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createModuleSchema = z.object({
  title: z.string().min(2),
  courseId: z.string(),
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
    const validation = createModuleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const maxOrder = await prisma.module.findFirst({
      where: { courseId: validation.data.courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrder?.order ?? -1) + 1;

    const module = await prisma.module.create({
      data: {
        title: validation.data.title,
        courseId: validation.data.courseId,
        order: newOrder,
      },
    });

    return NextResponse.json({ data: module }, { status: 201 });
  } catch (error) {
    console.error("Create module error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
