"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUpload } from "@/components/image-upload";
import { Key, User, Loader2, Eye, EyeOff, Pencil, Check, X, Camera, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { getRoleBadgeColor } from "@/lib/utils";

export default function UserSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const user = session?.user;

  const profileMutation = useMutation({
    mutationFn: (data: { name?: string; image?: string | null }) =>
      apiClient.patch("/user/profile", data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-enrollments"] });
      await updateSession();
      toast.success(variables.name !== undefined ? "Name updated" : "Photo updated");
      setIsEditingName(false);
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to update");
    },
  });

  function startEditName() {
    setEditName(user?.name || "");
    setIsEditingName(true);
  }

  function cancelEditName() {
    setIsEditingName(false);
    setEditName("");
  }

  function saveName() {
    if (editName.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (editName.trim() === user?.name) {
      setIsEditingName(false);
      return;
    }
    profileMutation.mutate({ name: editName.trim() });
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (passwordData.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and profile</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Key className="mr-2 h-4 w-4" /> Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Header Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user?.image || undefined} />
                      <AvatarFallback className="text-3xl">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="max-w-[240px]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveName();
                            if (e.key === "Escape") cancelEditName();
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={saveName} disabled={profileMutation.isPending}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={cancelEditName}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={startEditName}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Mail className="h-3.5 w-3.5" />
                      {user?.email}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(user?.role || "")}`}>
                        <Shield className="h-3 w-3" />
                        {(user?.role || "USER").replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avatar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" /> Profile Photo
                </CardTitle>
                <CardDescription>Upload a new profile photo</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={user?.image || ""}
                  onChange={(url) => profileMutation.mutate({ image: url || null })}
                />
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Information</CardTitle>
                <CardDescription>Your basic account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">User ID</Label>
                    <p className="text-sm font-mono text-muted-foreground truncate">{user?.id || "—"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Private Course Access</Label>
                    <p className="text-sm">
                      {user?.isApproved || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Not Approved
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" /> Change Password
                </CardTitle>
                <CardDescription>
                  {user?.email?.includes("google")
                    ? "Password change is not available for Google login accounts."
                    : "Update your account password. Use at least 8 characters."}
                </CardDescription>
              </CardHeader>
              {user?.email && !user.email.includes("google") ? (
                <CardContent>
                  <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative mt-2">
                        <Input
                          id="current-password"
                          type={showCurrent ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                          disabled={isChangingPassword}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrent(!showCurrent)}
                        >
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative mt-2">
                        <Input
                          id="new-password"
                          type={showNew ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                          minLength={8}
                          disabled={isChangingPassword}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNew(!showNew)}
                        >
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        className="mt-2"
                        id="confirm-password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                        disabled={isChangingPassword}
                      />
                    </div>
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                      Change Password
                    </Button>
                  </form>
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your account uses Google authentication. Password management is handled by Google.
                  </p>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
