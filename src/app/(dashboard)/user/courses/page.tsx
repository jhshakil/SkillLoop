"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Play } from "lucide-react";
import { formatDate, getStatusBadgeColor } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import type { EnrollmentItem } from "@/types";

export default function UserCoursesPage() {
  const [search, setSearch] = useState("");

  const { data: enrollments, isLoading, error, refetch } = useQuery({
    queryKey: ["user-enrollments"],
    queryFn: async () => {
      const res = await apiClient.get("/enrollments");
      return res.data.data as EnrollmentItem[];
    },
  });

  const filtered = (enrollments || []).filter((e) => {
    if (!search) return true;
    return e.course.title.toLowerCase().includes(search.toLowerCase());
  });

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">My Courses</h1>
          <Card className="text-center py-12">
            <p className="text-destructive mb-2">Failed to load courses</p>
            <p className="text-sm text-muted-foreground mb-4">{(error as Error)?.message || "Unknown error"}</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Courses you are enrolled in</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search enrolled courses..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded mt-2" />
                  <div className="h-9 w-24 bg-muted rounded mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filtered.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((enrollment) => (
                  <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {enrollment.course.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusBadgeColor(enrollment.status)}>
                              {enrollment.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              <BookOpen className="inline h-3 w-3 mr-1" />
                              Enrolled {formatDate(enrollment.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button className="mt-4" size="sm" asChild>
                        <Link href={`/user/courses/${enrollment.courseId}`}>
                          <Play className="mr-2 h-3 w-3" /> View Course
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {search
                    ? "No courses match your search."
                    : "You haven't enrolled in any courses yet."}
                </p>
                {!search && (
                  <Button className="mt-4" variant="outline" asChild>
                    <Link href="/user/dashboard#explore">Explore Courses</Link>
                  </Button>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
