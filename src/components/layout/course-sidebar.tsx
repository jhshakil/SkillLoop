"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Play, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { extractYouTubeId } from "@/lib/utils";
import type { CourseWithModules } from "@/types";

interface VideoNavItem {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  youtubeUrl: string;
  description: string | null;
}

interface CourseSidebarProps {
  course: CourseWithModules;
  courseId: string;
}

export function CourseSidebar({ course, courseId }: CourseSidebarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const currentVideoId = segments[segments.length - 1];
  const [collapsed, setCollapsed] = useState(false);

  const { flatVideos, currentIndex } = useMemo(() => {
    const flat: VideoNavItem[] = [];
    for (const mod of course.modules) {
      for (const video of mod.videos) {
        if (video.status === "PUBLISHED") {
          flat.push({
            id: video.id,
            title: video.title,
            moduleId: mod.id,
            moduleTitle: mod.title,
            youtubeUrl: video.youtubeUrl,
            description: video.description,
          });
        }
      }
    }
    const idx = flat.findIndex((v) => v.id === currentVideoId);
    return { flatVideos: flat, currentIndex: idx };
  }, [course.modules, currentVideoId]);

  const prevVideo = currentIndex > 0 ? flatVideos[currentIndex - 1] : null;
  const nextVideo = currentIndex < flatVideos.length - 1 ? flatVideos[currentIndex + 1] : null;

  const currentModuleId = flatVideos[currentIndex]?.moduleId;
  const defaultOpenModule = currentModuleId || course.modules[0]?.id || "";

  if (collapsed) {
    return (
      <aside className="w-12 border-r bg-background flex flex-col h-full shrink-0 items-center py-2 gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
        {prevVideo && (
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Previous video">
            <Link href={`/user/courses/${courseId}/modules/${prevVideo.moduleId}/videos/${prevVideo.id}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        )}
        {nextVideo && (
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Next video">
            <Link href={`/user/courses/${courseId}/modules/${nextVideo.moduleId}/videos/${nextVideo.id}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </aside>
    );
  }

  return (
    <aside className="w-[320px] border-r bg-background flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm truncate">{course.title}</h3>
          <p className="text-xs text-muted-foreground">
            {flatVideos.length} video{flatVideos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 ml-2"
          onClick={() => setCollapsed(true)}
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation buttons */}
      {(prevVideo || nextVideo) && (
        <div className="flex items-center gap-2 p-2 border-b">
          {prevVideo ? (
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
              <Link href={`/user/courses/${courseId}/modules/${prevVideo.moduleId}/videos/${prevVideo.id}`}>
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Link>
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          {nextVideo ? (
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
              <Link href={`/user/courses/${courseId}/modules/${nextVideo.moduleId}/videos/${nextVideo.id}`}>
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      )}

      {/* Modules & Videos */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {course.modules.length > 0 ? (
            <Accordion type="single" collapsible defaultValue={defaultOpenModule}>
              {course.modules.map((mod, modIdx) => {
                const publishedVideos = mod.videos.filter((v) => v.status === "PUBLISHED");
                if (publishedVideos.length === 0) return null;
                return (
                  <AccordionItem key={mod.id} value={mod.id} className="border-b last:border-0">
                    <AccordionTrigger className="py-2.5 px-2 text-sm hover:no-underline [&[data-state=open]>svg]:text-foreground">
                      <div className="flex items-center gap-2.5 text-left flex-1 min-w-0">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                          {modIdx + 1}
                        </span>
                        <span className="truncate text-sm font-medium">{mod.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-0.5 pb-1">
                        {publishedVideos.map((video, vidIdx) => {
                          const isActive = video.id === currentVideoId;
                          return (
                            <Link
                              key={video.id}
                              href={`/user/courses/${courseId}/modules/${mod.id}/videos/${video.id}`}
                            >
                              <div
                                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors group ${
                                  isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <span className="text-xs w-5 text-center shrink-0">
                                  {vidIdx + 1}
                                </span>
                                <div className="relative w-14 h-8 rounded overflow-hidden shrink-0 bg-black">
                                  {extractYouTubeId(video.youtubeUrl) ? (
                                    <Image
                                      src={`https://img.youtube.com/vi/${extractYouTubeId(video.youtubeUrl)}/mqdefault.jpg`}
                                      alt={video.title}
                                      width={56}
                                      height={32}
                                      className="w-full h-full object-cover opacity-80"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full">
                                      <Play className="h-3 w-3 text-white/50" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Play className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <span className="text-xs truncate flex-1">{video.title}</span>
                                {isActive && (
                                  <Play className="h-3 w-3 text-primary shrink-0 fill-primary" />
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No modules yet.
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
