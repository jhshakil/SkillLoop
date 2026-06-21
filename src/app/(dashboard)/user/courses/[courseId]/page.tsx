"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, BookOpen, Play, CheckCircle, Loader2 } from "lucide-react";
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

  const publishedVideoCount = useMemo(
    () => course?.modules?.reduce((sum, m) => sum + m.videos.filter((v) => v.status === "PUBLISHED").length, 0) ?? 0,
    [course?.modules]
  );

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
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!course) {
    return (
      <Card className="text-center py-12">
        <p className="text-muted-foreground">Course not found.</p>
      </Card>
    );
  }

  return (
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
            <span className="text-sm text-muted-foreground">
              Created by {course.creator.name || "Admin"}
            </span>
          </div>
          {session?.user && !isEnrolled && course.status === "PUBLISHED" && (
            <Button onClick={() => setIsEnrollOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" /> Enroll
            </Button>
          )}
        </div>

        {/* Thumbnail */}
        <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden bg-muted">
          {course.thumbnail ? (
            <Image src={course.thumbnail} alt={course.title} fill className="object-cover" sizes="100vw" priority />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-16 w-16 text-muted-foreground/30" />
            </div>
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
        <div className="grid gap-4 grid-cols-2">
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
                  {publishedVideoCount}
                </p>
                <p className="text-sm text-muted-foreground">Videos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Content */}
        {isEnrolled ? (
          <div>
            {publishedVideoCount > 0 && (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Course Content</h2>
                <span className="text-sm text-muted-foreground">
                  Browse modules and videos in the sidebar ←
                </span>
              </div>
            )}
            {course.modules.length === 0 && (
              <Card className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No modules have been added to this course yet.
                </p>
              </Card>
            )}
          </div>
        ) : (
          <Card className="text-center py-12 border-primary/30 bg-primary/5">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Enroll to Access Content</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              You need to enroll in this course to access modules, videos, and other learning materials.
            </p>
            {course.status === "PUBLISHED" ? (
              <Button
                size="lg"
                onClick={() => setIsEnrollOpen(true)}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Enroll Now — Free
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                This course is not yet published. Check back later.
              </p>
            )}
          </Card>
        )}

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
  );
}
