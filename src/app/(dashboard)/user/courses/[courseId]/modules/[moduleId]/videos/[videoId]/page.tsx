"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, MessageSquare, ChevronRight, CheckCircle, Loader2, Lock, ChevronLeft } from "lucide-react";
import { extractYouTubeId, timeAgo } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import type { EnrollmentItem, CourseWithModules } from "@/types";

interface CommentData {
  id: string;
  content: string;
  userId: string;
  videoId: string;
  parentId: string | null;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null; role: string };
  replies?: CommentData[];
}

export default function UserVideoPage() {
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();
  const videoId = params.videoId as string;
  const courseId = params.courseId as string;

  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["user-enrollments"],
    queryFn: async () => {
      const res = await apiClient.get("/enrollments");
      return res.data.data as EnrollmentItem[];
    },
  });

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const res = await apiClient.get(`/courses/${courseId}`);
      return res.data.data as CourseWithModules;
    },
  });

  const { prevVideo, nextVideo } = useMemo(() => {
    if (!course) return { prevVideo: null, nextVideo: null };
    const flat: { id: string; moduleId: string }[] = [];
    for (const mod of course.modules) {
      for (const v of mod.videos) {
        if (v.status === "PUBLISHED") {
          flat.push({ id: v.id, moduleId: mod.id });
        }
      }
    }
    const idx = flat.findIndex((v) => v.id === videoId);
    return {
      prevVideo: idx > 0 ? flat[idx - 1] : null,
      nextVideo: idx < flat.length - 1 ? flat[idx + 1] : null,
    };
  }, [course, videoId]);

  const isEnrolled = !!enrollments?.find((e: EnrollmentItem) => e.courseId === courseId);

  const enrollMutation = useMutation({
    mutationFn: () => apiClient.post("/enrollments", { courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-enrollments"] });
      toast.success("Successfully enrolled!");
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to enroll");
    },
  });

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      const res = await apiClient.get(`/videos/${videoId}`);
      return res.data.data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      const res = await apiClient.get("/comments", { params: { videoId } });
      return res.data.data || [];
    },
    enabled: !!video?.commentsEnabled,
  });

  const commentMutation = useMutation({
    mutationFn: (data: { content: string; videoId: string; parentId?: string }) =>
      apiClient.post("/comments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      setCommentText("");
      setReplyText({});
      toast.success("Comment posted");
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiClient.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      toast.success("Comment deleted");
    },
  });

  const toggleCommentMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiClient.patch(`/videos/${videoId}`, { commentsEnabled: enabled }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
      toast.success(variables ? "Comments enabled" : "Comments disabled");
    },
  });

  const userRole = session?.user?.role;
  const isSessionLoading = sessionStatus === "loading";

  if (isLoading || isSessionLoading || enrollmentsLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-muted rounded" /><div className="aspect-video bg-muted rounded" /></div>;
  }

  if (!video) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/user/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Card className="text-center py-16">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Video Not Available</h2>
          <p className="text-muted-foreground">This video is not available or has been removed.</p>
        </Card>
      </div>
    );
  }

  const youtubeId = extractYouTubeId(video?.youtubeUrl || "");

  if (!isEnrolled && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/user/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{video?.title}</h1>
            <p className="text-sm text-muted-foreground">
              {video?.module?.course?.title} <ChevronRight className="inline h-3 w-3" /> {video?.module?.title}
            </p>
          </div>
        </div>

        <Card className="text-center py-16 border-primary/30 bg-primary/5">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Enrollment Required</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You need to enroll in this course to watch videos, leave comments, and access learning materials.
          </p>
          <Button
            size="lg"
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
          >
            {enrollMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Enroll to Watch
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/user/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{video?.title}</h1>
          <p className="text-sm text-muted-foreground">
            {video?.module?.course?.title} <ChevronRight className="inline h-3 w-3" /> {video?.module?.title}
          </p>
        </div>
      </div>

      {youtubeId && (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {(video?.description || (userRole === "ADMIN" || userRole === "SUPER_ADMIN")) && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">{video?.description || ""}</p>
          {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
            <div>
              <Label className="text-xs mb-2">Comments</Label>
              <Switch className="mt-2" checked={video?.commentsEnabled} onCheckedChange={toggleCommentMutation.mutate} />
            </div>
          )}
        </div>
      )}

      {/* Next/Previous navigation */}
      {(prevVideo || nextVideo) && (
        <div className="flex items-center gap-2">
          {prevVideo ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/user/courses/${courseId}/modules/${prevVideo.moduleId}/videos/${prevVideo.id}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
            </Button>
          ) : (
            <div />
          )}
          <div className="flex-1" />
          {nextVideo ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/user/courses/${courseId}/modules/${nextVideo.moduleId}/videos/${nextVideo.id}`}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Comments
        </h2>
        {video?.commentsEnabled ? (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commentText.trim()) return;
                commentMutation.mutate({ content: commentText, videoId });
              }}
              className="flex gap-2"
            >
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[60px]"
              />
              <Button type="submit" size="icon" disabled={!commentText.trim() || commentMutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>

            <div className="space-y-4">
              {comments?.map((comment: CommentData) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  userRole={userRole || ""}
                  userId={session?.user?.id || ""}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  onReply={(content, parentId) => commentMutation.mutate({ content, videoId, parentId })}
                  onDelete={(id) => deleteCommentMutation.mutate(id)}
                />
              ))}
              {comments?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </>
        ) : (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Comments are disabled for this video.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function CommentNode({
  comment,
  userRole,
  userId,
  replyText,
  setReplyText,
  onReply,
  onDelete,
}: {
  comment: CommentData;
  userRole: string;
  userId: string;
  replyText: Record<string, string>;
  setReplyText: (val: Record<string, string>) => void;
  onReply: (content: string, parentId: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const isStaff = comment.user.role === "MODERATOR" || comment.user.role === "ADMIN" || comment.user.role === "SUPER_ADMIN";
  const canDelete = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "MODERATOR" || userId === comment.userId;

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user.image ?? undefined} />
          <AvatarFallback>{comment.user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.user.name}</span>
            {isStaff && (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">Author</Badge>
            )}
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setShowReply(!showReply)} className="text-xs text-muted-foreground hover:text-foreground">
              Reply
            </button>
            {canDelete && (
              <button onClick={() => onDelete(comment.id)} className="text-xs text-destructive hover:underline">
                Delete
              </button>
            )}
          </div>

          {showReply && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = replyText[comment.id];
                if (!text?.trim()) return;
                onReply(text, comment.id);
              }}
              className="flex gap-2 mt-2"
            >
              <Input
                value={replyText[comment.id] || ""}
                onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                placeholder="Write a reply..."
                className="h-8 text-sm"
              />
              <Button type="submit" size="sm" disabled={!replyText[comment.id]?.trim()}>Reply</Button>
            </form>
          )}
        </div>
      </div>

      {comment.replies?.map((reply: CommentData) => (
        <div key={reply.id} className="ml-10">
          <CommentNode
            comment={reply}
            userRole={userRole}
            userId={userId}
            replyText={replyText}
            setReplyText={setReplyText}
            onReply={onReply}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
