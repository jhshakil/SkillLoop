"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, MessageSquare, Trash2, Reply } from "lucide-react";
import { formatDate, getRoleBadgeColor } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import type { ModeratorActivityItem } from "@/types";

const actionConfig: Record<string, { icon: React.ElementType; label: string }> = {
  REPLY_COMMENT: { icon: Reply, label: "Replied to comment" },
  DELETE_COMMENT: { icon: Trash2, label: "Deleted a comment" },
};

export default function AdminAnalyticsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", page],
    queryFn: async () => {
      const res = await apiClient.get("/analytics", {
        params: { type: "moderator", page, pageSize: 20 },
      });
      return res.data as {
        data: ModeratorActivityItem[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Moderator Analytics</h1>
          <p className="text-muted-foreground">Track moderator activities across the platform</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/3 bg-muted rounded mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data?.data.map((activity) => {
                const config = actionConfig[activity.action] || {
                  icon: MessageSquare,
                  label: activity.action,
                };
                const ActionIcon = config.icon;

                return (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-muted rounded-full p-2 shrink-0">
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                <span className="text-primary font-semibold">
                                  {activity.moderator.name || activity.moderator.email || "Unknown"}
                                </span>
                                {" "}{config.label}
                              </p>
                              {activity.details && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {activity.details}
                                </p>
                              )}
                            </div>
                            <Badge className={getRoleBadgeColor("MODERATOR")} variant="outline">
                              Moderator
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px]">
                              {activity.action}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(activity.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {data?.data.length === 0 && (
              <Card className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No moderator activities recorded yet.</p>
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
