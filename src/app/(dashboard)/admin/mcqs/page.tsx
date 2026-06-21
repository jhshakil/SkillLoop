"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Plus, Edit, Trash2, Search, BookOpen, Film, Layers, ToggleLeft, ToggleRight } from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

interface MCQData {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  status: string;
  videoId: string;
  order: number;
}

interface VideoNode {
  id: string;
  title: string;
  status: string;
  mcqQuestions: MCQData[];
}

interface ModuleNode {
  id: string;
  title: string;
  videos: VideoNode[];
}

interface CourseNode {
  id: string;
  title: string;
  status: string;
  modules: ModuleNode[];
}

const emptyMCQ = { question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" };

export default function AdminMCQsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [targetVideoId, setTargetVideoId] = useState("");
  const [editingMCQ, setEditingMCQ] = useState<MCQData | null>(null);
  const [formData, setFormData] = useState(emptyMCQ);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-mcq-hierarchy"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/mcqs");
      return (res.data.data || []) as CourseNode[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyMCQ & { videoId: string }) =>
      apiClient.post("/mcqs", { ...data, options: data.options.filter((o) => o.trim()) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mcq-hierarchy"] });
      setIsDialogOpen(false);
      setFormData(emptyMCQ);
      toast.success("Question created");
    },
    onError: () => toast.error("Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.patch(`/mcqs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mcq-hierarchy"] });
      setIsDialogOpen(false);
      setEditingMCQ(null);
      toast.success("Question updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/mcqs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mcq-hierarchy"] });
      toast.success("Question deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  function openCreate(videoId: string) {
    setDialogMode("create");
    setTargetVideoId(videoId);
    setFormData(emptyMCQ);
    setIsDialogOpen(true);
  }

  function openEdit(mcq: MCQData) {
    setDialogMode("edit");
    setEditingMCQ(mcq);
    setTargetVideoId(mcq.videoId);
    setFormData({
      question: mcq.question,
      options: [...mcq.options, ...Array(4 - mcq.options.length).fill("")].slice(0, 4),
      correctAnswer: mcq.correctAnswer,
      explanation: mcq.explanation || "",
    });
    setIsDialogOpen(true);
  }

  function handleOptionChange(index: number, value: string) {
    const opts = [...formData.options];
    opts[index] = value;
    setFormData({ ...formData, options: opts });
  }

  function totalMCQs(course: CourseNode) {
    let count = 0;
    for (const mod of course.modules) {
      for (const vid of mod.videos) {
        count += vid.mcqQuestions.length;
      }
    }
    return count;
  }

  const filteredCourses = search
    ? courses?.filter((c) => {
        const lower = search.toLowerCase();
        if (c.title.toLowerCase().includes(lower)) return true;
        for (const mod of c.modules) {
          if (mod.title.toLowerCase().includes(lower)) return true;
          for (const vid of mod.videos) {
            if (vid.title.toLowerCase().includes(lower)) return true;
            if (vid.mcqQuestions.some((q) => q.question.toLowerCase().includes(lower))) return true;
          }
        }
        return false;
      })
    : courses;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6" /> MCQ Management
          </h1>
          <p className="text-muted-foreground">Organize quiz questions by Course → Module → Video</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses, modules, videos, or questions..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 w-48 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {filteredCourses?.map((course) => (
              <AccordionItem key={course.id} value={course.id} className="border rounded-lg bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-base truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.modules.length} module{course.modules.length !== 1 ? "s" : ""} · {totalMCQs(course)} questions
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-auto mr-4 text-xs">{totalMCQs(course)} MCQs</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-2">
                  {/* Modules */}
                  <Accordion type="multiple" className="space-y-1">
                    {course.modules.map((mod) => (
                      <AccordionItem key={mod.id} value={mod.id} className="border rounded-md bg-muted/20">
                        <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                          <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                            <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{mod.title}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {mod.videos.length} video{mod.videos.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-2">
                          {/* Videos */}
                          <Accordion type="multiple" className="space-y-1">
                            {mod.videos.map((video) => (
                              <AccordionItem key={video.id} value={video.id} className="border rounded-md bg-background">
                                <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                                  <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                                    <Film className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">{video.title}</span>
                                    <Badge variant="outline" className="text-[10px] shrink-0">
                                      {video.mcqQuestions.length}
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-1 pb-1">
                                  {/* MCQs */}
                                  <div className="space-y-1">
                                    {video.mcqQuestions
                                      .sort((a, b) => a.order - b.order)
                                      .map((mcq, idx) => (
                                        <div
                                          key={mcq.id}
                                          className={`flex items-start gap-2 p-2 rounded-md ${
                                            mcq.status === "DRAFT" ? "opacity-60" : ""
                                          }`}
                                        >
                                          <span className="text-xs text-muted-foreground w-6 text-center shrink-0 pt-0.5">{idx + 1}.</span>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <Badge
                                                variant={mcq.status === "PUBLISHED" ? "default" : "outline"}
                                                className="text-[10px] px-1 py-0"
                                              >
                                                {mcq.status}
                                              </Badge>
                                              <span className="text-sm">{mcq.question}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {mcq.options.map((opt, i) => (
                                                <span
                                                  key={i}
                                                  className={`text-[11px] px-1.5 py-0.5 rounded ${
                                                    i === mcq.correctAnswer
                                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium"
                                                      : "bg-muted text-muted-foreground"
                                                  }`}
                                                >
                                                  {String.fromCharCode(65 + i)}. {opt}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-0.5 shrink-0">
                                            <Button
                                              variant="ghost" size="icon" className="h-7 w-7 cursor-pointer"
                                              onClick={() => updateMutation.mutate({
                                                id: mcq.id,
                                                data: { status: mcq.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
                                              })}
                                              title={mcq.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                                            >
                                              {mcq.status === "PUBLISHED" ? (
                                                <ToggleRight className="h-4 w-4 text-green-600" />
                                              ) : (
                                                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                              )}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => openEdit(mcq)} title="Edit">
                                              <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              variant="ghost" size="icon" className="h-7 w-7 cursor-pointer text-destructive"
                                              onClick={() => { if (confirm("Delete this question?")) deleteMutation.mutate(mcq.id); }}
                                              title="Delete"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                      onClick={() => openCreate(video.id)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" /> Add Question
                                    </Button>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {!isLoading && filteredCourses?.length === 0 && (
          <Card className="text-center py-16">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search ? "No results match your search." : "No courses yet. Create a course first!"}
            </p>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Add Question" : "Edit Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Question</Label>
              <Textarea
                className="mt-2"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter your question"
              />
            </div>
            <div className="space-y-2">
              <Label>Options — click letter to mark correct answer</Label>
              {formData.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={formData.correctAnswer === i ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setFormData({ ...formData, correctAnswer: i })}
                  >
                    {String.fromCharCode(65 + i)}
                  </Button>
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  />
                </div>
              ))}
            </div>
            <div>
              <Label>Explanation (optional)</Label>
              <Textarea
                className="mt-2"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Explain why this answer is correct"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const validOpts = formData.options.filter((o) => o.trim());
                if (!formData.question.trim()) { toast.error("Question is required"); return; }
                if (validOpts.length < 2) { toast.error("At least 2 options required"); return; }
                if (dialogMode === "edit" && editingMCQ) {
                  updateMutation.mutate({
                    id: editingMCQ.id,
                    data: { question: formData.question, options: validOpts, correctAnswer: formData.correctAnswer, explanation: formData.explanation || null },
                  });
                } else {
                  createMutation.mutate({ ...formData, videoId: targetVideoId, options: validOpts });
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {dialogMode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
