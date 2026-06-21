"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, HelpCircle, Check, X } from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

interface MCQQuestionData {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  submissions?: { selectedAnswer: number; isCorrect: boolean }[];
}

interface VideoRightSidebarProps {
  embedded?: boolean;
  onNavigate?: () => void;
}

export function VideoRightSidebar({ embedded, onNavigate }: VideoRightSidebarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const videoId = segments[segments.length - 1];

  // Only show on video pages (path includes /videos/)
  if (!pathname.includes("/videos/")) {
    return null;
  }

  return <VideoRightSidebarContent videoId={videoId} embedded={embedded} onNavigate={onNavigate} />;
}

function VideoRightSidebarContent({ videoId, embedded }: { videoId: string; embedded?: boolean; onNavigate?: () => void }) {
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState("");
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});

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

  return (
    <aside className={`${embedded ? "w-full" : "w-[340px]"} border-l bg-background flex flex-col h-full shrink-0`}>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Tools</h3>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="notes" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-3 w-fit">
            <TabsTrigger value="notes" className="text-xs">
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Notes
            </TabsTrigger>
            <TabsTrigger value="mcq" className="text-xs">
              <HelpCircle className="mr-1.5 h-3.5 w-3.5" /> Quiz ({mcqQuestions?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="flex-1 overflow-y-auto p-4 mt-0 data-[state=inactive]:hidden">
            <div className="space-y-3">
              <Textarea
                key={note?.id || "new"}
                placeholder="Write your notes here..."
                defaultValue={note?.content || ""}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[300px] text-sm"
              />
              <Button
                size="sm"
                onClick={() => noteMutation.mutate({ content: noteContent, videoId })}
                disabled={noteMutation.isPending}
                className="w-full"
              >
                {noteMutation.isPending ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="mcq" className="flex-1 overflow-y-auto p-4 mt-0 data-[state=inactive]:hidden">
            <div className="space-y-4">
              {mcqQuestions?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No quiz questions for this video.
                </p>
              ) : (
                mcqQuestions?.map((q: MCQQuestionData) => (
                  <MCQMiniCard
                    key={q.id}
                    question={q}
                    selectedAnswer={mcqAnswers[q.id]}
                    onSelect={(answer) => setMcqAnswers({ ...mcqAnswers, [q.id]: answer })}
                    onSubmit={() =>
                      mcqSubmitMutation.mutate({
                        questionId: q.id,
                        selectedAnswer: mcqAnswers[q.id],
                      })
                    }
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}

function MCQMiniCard({
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {question.options.map((option: string, i: number) => {
          let className =
            "flex items-center gap-2 p-2 rounded-md border text-sm cursor-pointer transition-colors hover:bg-muted";
          if (isSubmitted) {
            if (i === question.correctAnswer)
              className += " border-success bg-success/10";
            else if (submission.selectedAnswer === i && !submission.isCorrect)
              className += " border-destructive bg-destructive/10";
          } else if (selectedAnswer === i) {
            className += " border-primary bg-primary/10";
          }

          return (
            <div
              key={i}
              className={className}
              onClick={() => !isSubmitted && onSelect(i)}
            >
              <span className="text-xs font-medium w-5">
                {String.fromCharCode(65 + i)}.
              </span>
              <span className="text-sm flex-1">{option}</span>
              {isSubmitted && i === question.correctAnswer && (
                <Check className="h-3.5 w-3.5 text-success shrink-0" />
              )}
              {isSubmitted &&
                submission.selectedAnswer === i &&
                !submission.isCorrect && (
                  <X className="h-3.5 w-3.5 text-destructive shrink-0" />
                )}
            </div>
          );
        })}

        {!isSubmitted && (
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={selectedAnswer === undefined}
            className="w-full mt-2"
          >
            Submit
          </Button>
        )}

        {isSubmitted && submission.isCorrect && (
          <p className="text-xs text-success font-medium">Correct!</p>
        )}
        {isSubmitted && !submission.isCorrect && (
          <div className="text-xs text-muted-foreground">
            <p>
              Answer:{" "}
              <span className="text-success font-medium">
                {String.fromCharCode(65 + question.correctAnswer)}.{" "}
                {question.options[question.correctAnswer]}
              </span>
            </p>
            {question.explanation && (
              <p className="mt-1">{question.explanation}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
