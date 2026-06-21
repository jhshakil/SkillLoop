"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { CourseSidebar } from "@/components/layout/course-sidebar";
import { VideoRightSidebar } from "@/components/layout/video-right-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from "@/lib/api-client";
import type { CourseWithModules } from "@/types";

export default function CourseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const courseId = params.courseId as string;

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const res = await apiClient.get(`/courses/${courseId}`);
      return res.data.data as CourseWithModules;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-[320px] border-r bg-background shrink-0 p-4">
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </aside>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="animate-pulse space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-screen overflow-hidden flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <CourseSidebar course={course} courseId={courseId} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        <VideoRightSidebar />
      </div>
    </div>
  );
}
