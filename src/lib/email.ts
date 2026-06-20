import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(email: string, otp: string, type: "SIGNUP" | "FORGOT_PASSWORD") {
  const subject =
    type === "SIGNUP"
      ? "SkillLoop - Email Verification OTP"
      : "SkillLoop - Password Reset OTP";

  const purpose =
    type === "SIGNUP"
      ? "verify your email and complete registration"
      : "reset your password";

  const html = `
    <div style="max-width: 480px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">SkillLoop</h1>
      </div>
      <div style="background: #fff; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #111827; font-size: 18px; margin: 0 0 8px;">Your OTP Code</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
          Use the code below to ${purpose}. This code expires in 10 minutes.
        </p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #4F46E5;">${otp}</span>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          If you did not request this code, please ignore this email.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"SkillLoop" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html,
  });
}
