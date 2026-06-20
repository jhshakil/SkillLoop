"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, BookOpen, Play, Users, CheckCircle } from "lucide-react";
import { formatDate, getStatusBadgeColor, extractYouTubeId } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import type { CourseWithModules, EnrollmentItem } from "@/types";

export default function UserCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const res = await apiClient.get(`/courses/${courseId}`);
      return res.data.data as CourseWithModules;
    },
  });

  const { data: enrollments } = useQuery({
    queryKey: ["user-enrollments"],
    queryFn: async () => {
      const res = await apiClient.get("/enrollments");
      return res.data.data as EnrollmentItem[];
    },
  });

  const enrollment = enrollments?.find((e) => e.courseId === courseId);
  const isEnrolled = !!enrollment;

  const enrollMutation = useMutation({
    mutationFn: () => apiClient.post("/enrollments", { courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-enrollments"] });
      setIsEnrollOpen(false);
      toast.success("Successfully enrolled!");
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to enroll");
    },
  });

  if (isCourseLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <Card className="text-center py-12">
          <p className="text-muted-foreground">Course not found.</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/user/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusBadgeColor(course.status)}>
                {course.status}
              </Badge>
              <Badge variant="outline">{course.type}</Badge>
              <span className="text-sm text-muted-foreground">
                Created by {course.creator.name || "Admin"}
              </span>
            </div>
          </div>
          {session?.user && !isEnrolled && course.status === "PUBLISHED" && (
            <Button onClick={() => setIsEnrollOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" /> Enroll
            </Button>
          )}
          {isEnrolled && (
            <Badge variant="outline" className="text-green-600 px-3 py-1.5">
              <CheckCircle className="mr-1 h-3 w-3" /> Enrolled
            </Badge>
          )}
        </div>

        {/* Description */}
        {course.description && (
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {course.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{course.modules.length}</p>
                <p className="text-sm text-muted-foreground">Modules</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Play className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {course.modules.reduce((sum, m) => sum + m.videos.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Videos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {course._count?.enrollments || 0}
                </p>
                <p className="text-sm text-muted-foreground">Enrolled</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules & Videos */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Course Content</h2>
          {course.modules.length > 0 ? (
            <Tabs defaultValue={course.modules[0]?.id} className="space-y-4">
              <TabsList className="w-full justify-start flex-wrap h-auto">
                {course.modules.map((mod) => (
                  <TabsTrigger key={mod.id} value={mod.id}>
                    {mod.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {course.modules.map((mod) => (
                <TabsContent
                  key={mod.id}
                  value={mod.id}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{mod.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      {mod.videos.length} video{mod.videos.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {mod.videos.map((video, idx) => (
                    <Card key={video.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="relative w-40 h-24 rounded-md overflow-hidden shrink-0 bg-muted">
                          {extractYouTubeId(video.youtubeUrl) && (
                            <Image
                              src={`https://img.youtube.com/vi/${extractYouTubeId(video.youtubeUrl)}/mqdefault.jpg`}
                              alt={video.title}
                              width={160}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">
                            {idx + 1}. {video.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                            {video.description || "No description"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusBadgeColor(video.status)}>
                              {video.status}
                            </Badge>
                            {video._count?.comments !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {video._count.comments} comment
                                {video._count.comments !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/user/courses/${courseId}/modules/${mod.id}/videos/${video.id}`}
                          >
                            <Play className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {mod.videos.length === 0 && (
                    <Card className="py-6 text-center">
                      <p className="text-muted-foreground text-sm">
                        No videos in this module yet.
                      </p>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No modules have been added to this course yet.
              </p>
            </Card>
          )}
        </div>

        {/* Enroll Dialog */}
        <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll in {course.title}</DialogTitle>
              <DialogDescription>
                {course.type === "PRIVATE"
                  ? "This is a private course. You may need approval to enroll."
                  : "Get full access to all modules and videos in this course."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <span>{course.modules.length} modules</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Play className="h-5 w-5 text-muted-foreground" />
                <span>
                  {course.modules.reduce((s, m) => s + m.videos.length, 0)} videos
                </span>
              </div>
              {course.type === "PRIVATE" && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  This course requires approval to access.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEnrollOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
