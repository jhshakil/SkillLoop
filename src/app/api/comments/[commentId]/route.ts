import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await params;
    const role = session.user.role;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isOwner = comment.userId === session.user.id;
    const isPrivileged = role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR";

    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete nested replies first
    await prisma.comment.deleteMany({ where: { parentId: commentId } });
    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
