"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, TrendingUp, Play, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import type { EnrollmentItem, NoteWithVideo } from "@/types";

export default function UserDashboardPage() {
  const { data: enrollments } = useQuery({
    queryKey: ["user-enrollments"],
    queryFn: async () => {
      const res = await apiClient.get("/enrollments");
      return res.data.data as EnrollmentItem[];
    },
  });

  const { data: notes } = useQuery({
    queryKey: ["user-notes-dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/notes", { params: { pageSize: 5 } });
      return res.data.data as NoteWithVideo[];
    },
  });

  const { data: courses } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const res = await apiClient.get("/courses", {
        params: { status: "PUBLISHED", pageSize: 6 },
      });
      return res.data.data || [];
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Continue your learning journey.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Notes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{notes?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Courses</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{courses?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* My Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Courses</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/user/courses">View All <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enrollments?.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold">{enrollment.course.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enrolled {formatDate(enrollment.createdAt)}
                  </p>
                  <Button size="sm" className="mt-3" asChild>
                    <Link href={`/user/courses/${enrollment.courseId}`}>
                      <Play className="mr-2 h-3 w-3" /> Continue
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
            {enrollments?.length === 0 && (
              <Card className="col-span-full py-8 text-center">
                <p className="text-muted-foreground">You haven&apos;t enrolled in any courses yet.</p>
                <Button className="mt-3" variant="outline" asChild>
                  <Link href="#explore">Explore Courses</Link>
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Notes</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/user/notes">View All <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {notes?.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {note.video.module.course.title} &gt; {note.video.module.title} &gt; {note.video.title}
                      </p>
                      <p className="mt-1 line-clamp-2">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(note.createdAt)}</p>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/user/courses/${note.video.module.course.id}/modules/${note.video.module.id}/videos/${note.videoId}`}>
                        <Play className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {notes?.length === 0 && (
              <Card className="py-6 text-center">
                <p className="text-muted-foreground">No notes yet. Start watching videos and taking notes!</p>
              </Card>
            )}
          </div>
        </div>

        {/* Explore Courses */}
        <div id="explore">
          <h2 className="text-lg font-semibold mb-4">Explore Courses</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {courses?.map((course: { id: string; title: string; description: string | null; status: string; type: string; _count?: { modules: number } }) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {course.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      {course._count?.modules || 0} modules
                    </span>
                    <Button size="sm" asChild>
                      <Link href={`/user/courses/${course.id}`}>
                        View Course
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
