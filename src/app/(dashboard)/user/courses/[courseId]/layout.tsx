"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { CourseSidebar } from "@/components/layout/course-sidebar";
import { VideoRightSidebar } from "@/components/layout/video-right-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Menu, X, PanelRight } from "lucide-react";
import apiClient from "@/lib/api-client";
import type { CourseWithModules } from "@/types";

export default function CourseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const courseId = params.courseId as string;
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

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
          <aside className="hidden lg:block w-[320px] border-r bg-background shrink-0 p-4">
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      <Navbar>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={() => setLeftOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open modules</span>
        </Button>
      </Navbar>

      {/* Mobile Left Sidebar Overlay */}
      {leftOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setLeftOpen(false)}
          />
          <div className="relative h-full w-[320px] animate-in slide-in-from-left">
            <CourseSidebar course={course} courseId={courseId} embedded onNavigate={() => setLeftOpen(false)} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8"
              onClick={() => setLeftOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Right Sidebar Overlay */}
      {rightOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRightOpen(false)}
          />
          <div className="relative ml-auto h-full w-[340px] animate-in slide-in-from-right">
            <VideoRightSidebar embedded onNavigate={() => setRightOpen(false)} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 left-3 h-8 w-8"
              onClick={() => setRightOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Left Sidebar */}
        <div className="hidden lg:block">
          <CourseSidebar course={course} courseId={courseId} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>

        {/* Desktop Right Sidebar */}
        <div className="hidden lg:block">
          <VideoRightSidebar />
        </div>

        {/* Mobile right sidebar toggle */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={() => setRightOpen(true)}
          >
            <PanelRight className="h-5 w-5" />
            <span className="sr-only">Open tools</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
