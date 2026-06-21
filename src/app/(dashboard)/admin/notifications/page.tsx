"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { formatDate, timeAgo } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import type { NotificationItem } from "@/types";

const typeIcons: Record<string, string> = {
  COMMENT: "💬",
  ENROLLMENT: "📚",
  COURSE_UPDATE: "📝",
  REPLY: "↩️",
};

export default function AdminNotificationsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications", page],
    queryFn: async () => {
      const res = await apiClient.get("/notifications", {
        params: { page, pageSize: 20 },
      });
      return res.data as {
        data: NotificationItem[];
        total: number;
        unreadCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch("/notifications", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: () => toast.error("Failed to mark as read"),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.patch("/notifications", { markAllRead: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: () => toast.error("Failed to mark all as read"),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {data?.unreadCount !== undefined && data.unreadCount > 0
                ? `${data.unreadCount} unread notification${data.unreadCount > 1 ? "s" : ""}`
                : "Stay up to date with platform activity"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={!data?.unreadCount || markAllReadMutation.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" /> Mark All Read
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/4 bg-muted rounded mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data?.data.map((notification) => (
                <Card
                  key={notification.id}
                  className={`hover:shadow-md transition-shadow ${
                    !notification.isRead ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-lg shrink-0 mt-0.5">
                        {typeIcons[notification.type] || "📌"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">
                            {notification.message}
                          </p>
                          {!notification.isRead && (
                            <Badge variant="secondary" className="shrink-0">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(notification.createdAt)}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {notification.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markReadMutation.mutate(notification.id)}
                              disabled={markReadMutation.isPending}
                            >
                              <CheckCheck className="mr-1 h-3 w-3" /> Mark Read
                            </Button>
                          )}
                          {notification.link && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={notification.link}>
                                <ExternalLink className="mr-1 h-3 w-3" /> View
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data?.data.length === 0 && (
              <Card className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet.</p>
              </Card>
            )}

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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
