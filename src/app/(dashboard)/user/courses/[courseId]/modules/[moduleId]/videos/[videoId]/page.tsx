"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, MessageSquare, FileText, HelpCircle, Check, X, ChevronRight, CheckCircle, Loader2, Lock } from "lucide-react";
import { extractYouTubeId, timeAgo } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import type { EnrollmentItem } from "@/types";

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

interface MCQQuestionData {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  submissions?: { selectedAnswer: number; isCorrect: boolean }[];
}

export default function UserVideoPage() {
  const params = useParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const videoId = params.videoId as string;
  const courseId = params.courseId as string;

  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [noteContent, setNoteContent] = useState("");
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});

  const { data: enrollments } = useQuery({
    queryKey: ["user-enrollments"],
    queryFn: async () => {
      const res = await apiClient.get("/enrollments");
      return res.data.data as EnrollmentItem[];
    },
  });

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

  const { data: note } = useQuery({
    queryKey: ["note", videoId],
    queryFn: async () => {
      const res = await apiClient.get("/notes", { params: { videoId } });
      return res.data.data;
    },
  });

  const { data: mcqQuestions } = useQuery({
    queryKey: ["mcqs", videoId],
    queryFn: async () => {
      const res = await apiClient.get("/mcqs", { params: { videoId, status: "PUBLISHED" } });
      return res.data.data || [];
    },
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

  const noteMutation = useMutation({
    mutationFn: (data: { content: string; videoId: string }) => apiClient.post("/notes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", videoId] });
      toast.success("Note saved");
    },
    onError: () => toast.error("Failed to save note"),
  });

  const mcqSubmitMutation = useMutation({
    mutationFn: (data: { questionId: string; selectedAnswer: number }) =>
      apiClient.post("/mcqs/submit", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcqs", videoId] });
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

  if (isLoading) {
    return <DashboardLayout><div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-muted rounded" /><div className="aspect-video bg-muted rounded" /></div></DashboardLayout>;
  }

  const youtubeId = extractYouTubeId(video?.youtubeUrl || "");

  if (!isEnrolled && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl">
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
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
                <Switch className="mt-2"  checked={video?.commentsEnabled} onCheckedChange={toggleCommentMutation.mutate} />
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="comments">
          <TabsList>
            <TabsTrigger value="comments">
              <MessageSquare className="mr-2 h-4 w-4" /> Comments
            </TabsTrigger>
            <TabsTrigger value="notes">
              <FileText className="mr-2 h-4 w-4" /> Notes
            </TabsTrigger>
            <TabsTrigger value="mcq">
              <HelpCircle className="mr-2 h-4 w-4" /> Quiz ({mcqQuestions?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="space-y-4">
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
                </div>
              </>
            ) : (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Comments are disabled for this video.</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardContent className="space-y-4 pt-4">
                <Textarea
                  placeholder="Write your notes here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="min-h-[200px]"
                  defaultValue={note?.content || ""}
                />
                <Button onClick={() => noteMutation.mutate({ content: noteContent, videoId })} disabled={noteMutation.isPending}>
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mcq" className="space-y-4">
            {mcqQuestions?.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No quiz questions for this video.</CardContent></Card>
            ) : (
              mcqQuestions?.map((q: MCQQuestionData) => (
                <MCQCard
                  key={q.id}
                  question={q}
                  selectedAnswer={mcqAnswers[q.id]}
                  onSelect={(answer) => setMcqAnswers({ ...mcqAnswers, [q.id]: answer })}
                  onSubmit={() => mcqSubmitMutation.mutate({ questionId: q.id, selectedAnswer: mcqAnswers[q.id] })}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
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
  const isModerator = comment.user.role === "MODERATOR";
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
            {isModerator && (
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

function MCQCard({
  question,
  selectedAnswer,
  onSelect,
  onSubmit,
}: {
  question: MCQQuestionData;
  selectedAnswer: number | undefined;
  onSelect: (answer: number) => void;
  onSubmit: () => void;
}) {
  const submission = question.submissions?.[0];
  const isSubmitted = !!submission;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {question.options.map((option: string, i: number) => {
          let className = "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-muted";
          if (isSubmitted) {
            if (i === question.correctAnswer) className += " border-success bg-success/10";
            else if (submission.selectedAnswer === i && !submission.isCorrect) className += " border-destructive bg-destructive/10";
          } else if (selectedAnswer === i) {
            className += " border-primary bg-primary/10";
          }

          return (
            <div key={i} className={className} onClick={() => !isSubmitted && onSelect(i)}>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium">{String.fromCharCode(65 + i)}.</span>
                <span className="text-sm">{option}</span>
              </div>
              {isSubmitted && i === question.correctAnswer && <Check className="h-4 w-4 text-success" />}
              {isSubmitted && submission.selectedAnswer === i && !submission.isCorrect && <X className="h-4 w-4 text-destructive" />}
            </div>
          );
        })}

        {!isSubmitted && (
          <Button onClick={onSubmit} disabled={selectedAnswer === undefined} className="w-full mt-3">
            Submit
          </Button>
        )}

        {isSubmitted && submission.isCorrect && (
          <p className="text-sm text-success font-medium">Correct!</p>
        )}
        {isSubmitted && !submission.isCorrect && (
          <p className="text-sm text-muted-foreground">
            Correct answer: <span className="text-success font-medium">{String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}</span>
            {question.explanation && <span className="block mt-1">{question.explanation}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
