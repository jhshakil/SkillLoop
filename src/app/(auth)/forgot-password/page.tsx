"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function onSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post("/auth/otp/send", { email, type: "FORGOT_PASSWORD" });
      setStep("otp");
      toast.success("OTP sent to your email");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function onContinueToReset() {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    setStep("reset");
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        email,
        otp: otp.join(""),
        password: newPassword,
      });
      setStep("done");
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === "email" && "Forgot Password"}
            {step === "otp" && "Verify Email"}
            {step === "reset" && "Set New Password"}
            {step === "done" && "Password Reset"}
          </CardTitle>
          <CardDescription>
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "otp" && `Enter the code sent to ${email}`}
            {step === "reset" && "Choose a new password for your account"}
            {step === "done" && "Your password has been reset successfully"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" && (
            <form onSubmit={onSendOtp} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input className="mt-2" 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Code
              </Button>
            </form>
          )}

          {step === "otp" && (
            <div className="space-y-6">
              <Button variant="ghost" className="gap-2" onClick={() => setStep("email")} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <Input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-12 text-center text-lg font-bold"
                    maxLength={1}
                    disabled={isLoading}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              <Button className="w-full" onClick={onContinueToReset} disabled={otp.join("").length !== 6}>
                Continue
              </Button>
            </div>
          )}

          {step === "reset" && (
            <form onSubmit={onResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative mt-2" >
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input className="mt-2" 
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reset Password
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <p>Your password has been reset. You can now sign in with your new password.</p>
              <Button className="w-full" onClick={() => router.push("/login")}>
                Go to Sign In
              </Button>
            </div>
          )}
        </CardContent>
        {step === "email" && (
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
