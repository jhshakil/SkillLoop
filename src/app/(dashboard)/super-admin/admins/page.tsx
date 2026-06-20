"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Shield, UserCog, Trash2, Mail, UserPlus } from "lucide-react";
import { formatDate, getRoleBadgeColor } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import type { UserProfile } from "@/types";
import Image from "next/image";

export default function SuperAdminAdminsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [newApprovedEmail, setNewApprovedEmail] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["all-users", page, search],
    queryFn: async () => {
      const res = await apiClient.get("/admin/users", {
        params: { page, pageSize: 20, search },
      });
      return res.data as {
        data: UserProfile[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    },
  });

  const { data: emailsData } = useQuery({
    queryKey: ["approved-emails"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/approved-emails");
      return res.data.data as { id: string; email: string }[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiClient.patch(`/admin/users/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      toast.success("User role updated");
    },
    onError: () => toast.error("Failed to update role"),
  });

  const addApprovedEmailMutation = useMutation({
    mutationFn: (email: string) =>
      apiClient.post("/admin/approved-emails", { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approved-emails"] });
      setNewApprovedEmail("");
      toast.success("Approved email added");
    },
    onError: () => toast.error("Failed to add approved email"),
  });

  const removeApprovedEmailMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/admin/approved-emails/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approved-emails"] });
      toast.success("Approved email removed");
    },
    onError: () => toast.error("Failed to remove approved email"),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Users & Admins</h1>
          <p className="text-muted-foreground">
            Manage user roles and approved emails for private courses
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Users Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">All Users</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-5 w-1/3 bg-muted rounded" />
                      <div className="h-4 w-1/4 bg-muted rounded mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {data?.data.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || ""}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {user.name || "Unnamed User"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role.replace("_", " ")}
                            </Badge>
                            {user.isApproved ? (
                              <Badge variant="outline" className="text-green-600">
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600">
                                Not Approved
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(user.createdAt)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                                setIsRoleDialogOpen(true);
                              }}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {data && data.totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: data.totalPages }, (_, i) => (
                      <Button
                        key={i}
                        variant={page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                )}

                {data?.data.length === 0 && (
                  <Card className="text-center py-8">
                    <p className="text-muted-foreground">No users found.</p>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Approved Emails Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Approved Emails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Emails pre-approved for private course enrollment.
                </p>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add email..."
                    value={newApprovedEmail}
                    onChange={(e) => setNewApprovedEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newApprovedEmail) {
                        addApprovedEmailMutation.mutate(newApprovedEmail);
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={() => addApprovedEmailMutation.mutate(newApprovedEmail)}
                    disabled={!newApprovedEmail || addApprovedEmailMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(emailsData || []).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-md bg-muted/50 p-2"
                    >
                      <span className="text-sm truncate">{entry.email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeApprovedEmailMutation.mutate(entry.id)}
                        disabled={removeApprovedEmailMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {(emailsData || []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No approved emails yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Change Role Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedUser && (
                <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
                  <UserCog className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedUser.name || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              )}
              <div>
                <Label>Role</Label>
                <Select  value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="MODERATOR">Moderator</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedUser && newRole) {
                    updateRoleMutation.mutate({
                      userId: selectedUser.id,
                      role: newRole,
                    });
                  }
                }}
                disabled={!newRole || updateRoleMutation.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
