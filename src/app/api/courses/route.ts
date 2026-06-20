import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createCourseSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  type: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const where: Prisma.CourseWhereInput = {};
    if (type) where.type = type as "PUBLIC" | "PRIVATE";
    if (status) where.status = status as "DRAFT" | "PUBLISHED";

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          _count: { select: { modules: true, enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      data: courses,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get courses error:", error);
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
    const validation = createCourseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        ...validation.data,
        createdById: session.user.id,
      },
    });

    await prisma.adminActivity.create({
      data: {
        action: "CREATE_COURSE",
        details: `Created course: ${course.title}`,
        adminId: session.user.id,
        targetId: course.id,
      },
    });

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (error) {
    console.error("Create course error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
