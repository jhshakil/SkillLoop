import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateModuleSchema = z.object({
  title: z.string().min(2).optional(),
  order: z.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { moduleId } = await params;
    const body = await req.json();
    const validation = updateModuleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const module = await prisma.module.update({
      where: { id: moduleId },
      data: validation.data,
    });

    return NextResponse.json({ data: module });
  } catch (error) {
    console.error("Update module error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { moduleId } = await params;
    await prisma.module.delete({ where: { id: moduleId } });

    return NextResponse.json({ message: "Module deleted" });
  } catch (error) {
    console.error("Delete module error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
