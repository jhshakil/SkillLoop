import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  type: z.enum(["SIGNUP", "FORGOT_PASSWORD"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = verifyOtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, otp, type } = validation.data;

    const token = await prisma.otpToken.findFirst({
      where: { email, otp, type, isUsed: false },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (new Date() > token.expiresAt) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    await prisma.otpToken.update({
      where: { id: token.id },
      data: { isUsed: true },
    });

    return NextResponse.json({ message: "OTP verified successfully", verified: true });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
