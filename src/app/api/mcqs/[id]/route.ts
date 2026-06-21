import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateMCQSchema = z.object({
  question: z.string().min(1).optional(),
  options: z.array(z.string()).min(2).optional(),
  correctAnswer: z.number().min(0).optional(),
  explanation: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  order: z.number().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateMCQSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const question = await prisma.mCQQuestion.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ data: question });
  } catch (error) {
    console.error("Update MCQ error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.mCQQuestion.delete({ where: { id } });

    return NextResponse.json({ message: "MCQ deleted" });
  } catch (error) {
    console.error("Delete MCQ error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
