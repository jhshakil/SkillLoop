import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const enrollSchema = z.object({
  courseId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      const where: Prisma.EnrollmentWhereInput = {};
      if (courseId) where.courseId = courseId;
      if (status) where.status = status as "PENDING" | "APPROVED" | "REJECTED";

      const [enrollments, total] = await Promise.all([
        prisma.enrollment.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
            course: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.enrollment.count({ where }),
      ]);

      return NextResponse.json({
        data: enrollments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: { course: { select: { id: true, title: true, thumbnail: true } } },
    });

    return NextResponse.json({ data: enrollments });
  } catch (error) {
    console.error("Get enrollments error:", error);
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
    const validation = enrollSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: validation.data.courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.type === "PRIVATE" && !session.user.isApproved) {
      return NextResponse.json({ error: "This is a private course. You need approval to enroll." }, { status: 403 });
    }

    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: validation.data.courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: validation.data.courseId,
        status: "APPROVED",
      },
    });

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (error) {
    console.error("Enroll error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
