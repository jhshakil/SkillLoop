import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, BarChart3, ChevronRight, Play, Layers } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

export default async function HomePage() {
  const session = await auth();

  let courses: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    type: string;
    _count: { modules: number; enrollments: number };
  }[] = [];
  let coursesCount = 0;
  let usersCount = 0;

  try {
    courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        type: true,
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 9,
    });
    coursesCount = await prisma.course.count({ where: { status: "PUBLISHED" } });
    usersCount = await prisma.user.count();
  } catch {
    // Database not yet set up
  }

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>SkillLoop</span>
          </Link>
          <nav className="flex items-center gap-4">
            {session ? (
              <Button variant="ghost" asChild>
                <Link href="/user/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Learn Without Limits
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              SkillLoop is a modern learning management system designed to help you master
              new skills through structured courses, video lessons, and interactive assessments.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href={session ? "/user/dashboard" : "/register"}>
                  Get Started <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center p-6">
                <div className="inline-flex rounded-full bg-primary/10 p-3 mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">
                  {coursesCount > 0 ? `${coursesCount}+ Courses` : "Structured Courses"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Module-based learning with video lessons and quizzes
                </p>
              </div>
              <div className="text-center p-6">
                <div className="inline-flex rounded-full bg-primary/10 p-3 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">
                  {usersCount > 0 ? `${usersCount}+ Learners` : "Growing Community"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Join a community of learners worldwide
                </p>
              </div>
              <div className="text-center p-6">
                <div className="inline-flex rounded-full bg-primary/10 p-3 mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Track Progress</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Take notes, complete MCQs, and monitor your journey
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Courses */}
        {courses.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Explore Courses</h2>
                <p className="mt-3 text-muted-foreground">
                  Start learning from our collection of structured courses
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                    <div className="relative h-48 bg-muted">
                      {course.thumbnail ? (
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <Play className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        {course.type === "PRIVATE" && (
                          <Badge variant="secondary" className="text-xs">Private</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {course.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Layers className="h-4 w-4" />
                          {course._count.modules} modules
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course._count.enrollments} enrolled
                        </span>
                      </div>
                      <Button asChild className="w-full">
                        <Link href={session ? `/user/courses/${course.id}` : `/login?redirect=/user/courses/${course.id}`}>
                          View Course
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {coursesCount > 9 && (
                <div className="text-center mt-10">
                  <Button variant="outline" size="lg" asChild>
                    <Link href={session ? "/user/courses" : "/login"}>
                      View All Courses <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-20 border-t">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to Start Learning?</h2>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">
              Join SkillLoop today and unlock your potential.
            </p>
            <Button size="lg" className="mt-6" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SkillLoop. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
