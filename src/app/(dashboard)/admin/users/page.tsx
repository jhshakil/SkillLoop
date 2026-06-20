"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ChevronUp, ChevronDown, Users } from "lucide-react";
import { formatDate, getRoleBadgeColor } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState("");

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, pageSize: 10 };
      if (search) params.search = search;
      if (roleFilter !== "ALL") params.role = roleFilter;
      const res = await apiClient.get("/users", { params });
      return res.data;
    },
  });

  const roleMutation = useMutation({
    mutationFn: (payload: { userId: string; role: string }) =>
      apiClient.patch("/users", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User role updated");
      setSelectedUser(null);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(message || "Failed to update role");
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> User Management
          </h1>
          <p className="text-muted-foreground">Manage users and their roles</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="MODERATOR">Moderator</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              {isSuperAdmin && <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {data?.data.map((user: UserItem) => (
                <Card key={user.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name || "Unnamed"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block w-32 text-right">
                      {formatDate(user.createdAt)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role);
                      }}
                    >
                      Change Role
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data?.data.length === 0 && (
              <Card className="py-12 text-center text-muted-foreground">
                No users found
              </Card>
            )}

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update role for <strong>{selectedUser?.name || selectedUser?.email}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
              {!isSuperAdmin && newRole === "ADMIN" && (
                <p className="text-sm text-destructive">
                  Only Super Admin can assign Admin role.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (selectedUser) {
                    if (newRole === "ADMIN" && !isSuperAdmin) {
                      toast.error("Only Super Admin can assign Admin role");
                      return;
                    }
                    roleMutation.mutate({ userId: selectedUser.id, role: newRole });
                  }
                }}
                disabled={newRole === selectedUser?.role}
              >
                Update Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
