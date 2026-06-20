"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Search, Play, ArrowUpDown } from "lucide-react";
import { formatDate, truncateText } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import type { NoteWithVideo } from "@/types";

export default function UserNotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [courseId, setCourseId] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data: notesData, isLoading: isNotesLoading } = useQuery({
    queryKey: ["user-notes", page, search, sort, courseId],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        pageSize,
        sort,
      };
      if (search) params.search = search;
      if (courseId) params.courseId = courseId;
      const res = await apiClient.get("/notes", { params });
      return res.data as {
        data: NoteWithVideo[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    },
  });

  const { data: coursesData } = useQuery({
    queryKey: ["user-enrollments-for-filter"],
    queryFn: async () => {
      const res = await apiClient.get("/enrollments");
      return res.data.data as { course: { id: string; title: string } }[];
    },
  });

  const handleNavigateToVideo = (note: NoteWithVideo) => {
    const courseId = note.video.module.course.id;
    const moduleId = note.video.module.id;
    const videoId = note.video.id;
    router.push(
      `/user/courses/${courseId}/modules/${moduleId}/videos/${videoId}`
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Notes</h1>
          <p className="text-muted-foreground">
            All your notes organized by course and video
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select value={sort} onValueChange={(v) => { setSort(v as "newest" | "oldest"); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
          <Select value={courseId} onValueChange={(v) => { setCourseId(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {coursesData?.map((enrollment) => (
                <SelectItem key={enrollment.course.id} value={enrollment.course.id}>
                  {enrollment.course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isNotesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notesData?.data.map((note) => (
                <Card
                  key={note.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleNavigateToVideo(note)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <span className="font-medium text-foreground">
                            {note.video.module.course.title}
                          </span>
                          <span>&gt;</span>
                          <span>{note.video.module.title}</span>
                          <span>&gt;</span>
                          <span>{note.video.title}</span>
                        </div>
                        <p className="text-sm line-clamp-3 whitespace-pre-wrap">
                          {truncateText(note.content, 300)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Last updated {formatDate(note.updatedAt)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {notesData?.data.length === 0 && (
              <Card className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {search || courseId
                    ? "No notes match your filters."
                    : "No notes yet. Start watching videos and taking notes!"}
                </p>
              </Card>
            )}

            {notesData && notesData.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: notesData.totalPages }, (_, i) => (
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
