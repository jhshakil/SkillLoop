import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateCourseSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  type: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            videos: { orderBy: { order: "asc" } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ data: course });
  } catch (error) {
    console.error("Get course error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { courseId } = await params;
    const body = await req.json();
    const validation = updateCourseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: validation.data,
    });

    await prisma.adminActivity.create({
      data: {
        action: "UPDATE_COURSE",
        details: `Updated course: ${course.title}`,
        adminId: session.user.id,
        targetId: courseId,
      },
    });

    return NextResponse.json({ data: course });
  } catch (error) {
    console.error("Update course error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { courseId } = await params;
    await prisma.course.delete({ where: { id: courseId } });

    return NextResponse.json({ message: "Course deleted" });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
