import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (role === "ADMIN") {
      const [activities, total] = await Promise.all([
        prisma.moderatorActivity.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            moderator: { select: { id: true, name: true, email: true, image: true } },
          },
        }),
        prisma.moderatorActivity.count(),
      ]);

      return NextResponse.json({
        data: activities,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }

    if (role === "SUPER_ADMIN") {
      const [activities, total] = await Promise.all([
        prisma.adminActivity.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            admin: { select: { id: true, name: true, email: true, image: true } },
          },
        }),
        prisma.adminActivity.count(),
      ]);

      return NextResponse.json({
        data: activities,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
