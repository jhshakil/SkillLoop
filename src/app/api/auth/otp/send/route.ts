import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";
import { z } from "zod";

const sendOtpSchema = z.object({
  email: z.string().email(),
  type: z.enum(["SIGNUP", "FORGOT_PASSWORD"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = sendOtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, type } = validation.data;

    if (type === "SIGNUP") {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
    } else {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
      }
      if (!existingUser.password) {
        return NextResponse.json({ error: "This account uses Google login. No password to reset." }, { status: 400 });
      }
    }

    // Invalidate previous unused OTPs of same type
    await prisma.otpToken.updateMany({
      where: { email, type, isUsed: false },
      data: { isUsed: true },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpToken.create({
      data: { email, otp, type, expiresAt },
    });

    await sendOtpEmail(email, otp, type);

    return NextResponse.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
