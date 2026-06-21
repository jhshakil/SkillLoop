import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        modules: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            videos: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                status: true,
                mcqQuestions: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: courses });
  } catch (error) {
    console.error("Get MCQ hierarchy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
