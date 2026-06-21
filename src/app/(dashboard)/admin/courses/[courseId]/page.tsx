"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Play, Plus, Edit, Trash2, ArrowLeft, Film, BookOpen, HelpCircle } from "lucide-react";
import { formatDate, getStatusBadgeColor, extractYouTubeId } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import type { CourseWithModules } from "@/types";
import Image from "next/image";
import { ImageUpload } from "@/components/image-upload";

export default function AdminCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    type: "PUBLIC" as "PUBLIC" | "PRIVATE",
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
  });
  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isEditVideoOpen, setIsEditVideoOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [editingVideoId, setEditingVideoId] = useState("");
  const [newVideo, setNewVideo] = useState({
    title: "",
    youtubeUrl: "",
    description: "",
    commentsEnabled: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const res = await apiClient.get(`/courses/${courseId}`);
      return res.data.data as CourseWithModules;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      title?: string;
      description?: string | null;
      thumbnail?: string | null;
      type?: "PUBLIC" | "PRIVATE";
      status?: "DRAFT" | "PUBLISHED";
    }) => apiClient.patch(`/courses/${courseId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setIsEditing(false);
      toast.success("Course updated");
    },
  });

  const addModuleMutation = useMutation({
    mutationFn: (data: { title: string; courseId: string }) =>
      apiClient.post("/modules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setIsModuleOpen(false);
      setNewModuleTitle("");
      toast.success("Module added");
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => apiClient.delete(`/modules/${moduleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Module deleted");
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: (data: typeof newVideo & { moduleId: string }) =>
      apiClient.post("/videos", { ...data, moduleId: selectedModuleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setIsVideoOpen(false);
      setNewVideo({
        title: "",
        youtubeUrl: "",
        description: "",
        commentsEnabled: true,
      });
      toast.success("Video added");
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (videoId: string) => apiClient.delete(`/videos/${videoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Video deleted");
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: (data: { id: string; title?: string; youtubeUrl?: string; description?: string | null; commentsEnabled?: boolean }) =>
      apiClient.patch(`/videos/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setIsEditVideoOpen(false);
      toast.success("Video updated");
    },
  });

  const updateVideoStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/videos/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <Card className="text-center py-12">
          <p>Course not found</p>
        </Card>
      </DashboardLayout>
    );
  }

  const totalVideos = data.modules.reduce((s, m) => s + m.videos.length, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{data.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusBadgeColor(data.status)}>
                {data.status}
              </Badge>
              <Badge variant="outline">{data.type}</Badge>
              <span className="text-sm text-muted-foreground">
                Created by {data.creator.name} on {formatDate(data.createdAt)}
              </span>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditData({
                title: data.title,
                description: data.description || "",
                thumbnail: data.thumbnail || "",
                type: data.type,
                status: data.status,
              });
              setIsEditing(true);
            }}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>

        {/* Thumbnail */}
        {data.thumbnail && (
          <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden bg-muted">
            <Image src={data.thumbnail} alt={data.title} fill className="object-cover" sizes="100vw" priority />
          </div>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About this course</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {data.description || "No description"}
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.modules.length}</p>
                <p className="text-xs text-muted-foreground">Modules</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Film className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVideos}</p>
                <p className="text-xs text-muted-foreground">Videos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules Accordion */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Course Content</h2>
            <Button onClick={() => setIsModuleOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Module
            </Button>
          </div>

          {data.modules.length > 0 ? (
            <Accordion type="single" collapsible defaultValue={data.modules[0]?.id} className="space-y-2">
              {data.modules.map((mod, modIdx) => (
                <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left flex-1">
                      <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {modIdx + 1}
                      </span>
                      <div>
                        <p className="font-medium">{mod.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {mod.videos.length} video{mod.videos.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      className="inline-flex items-center justify-center h-7 w-7 mr-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete module "${mod.title}"?`))
                          deleteModuleMutation.mutate(mod.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          if (confirm(`Delete module "${mod.title}"?`))
                            deleteModuleMutation.mutate(mod.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {mod.videos.map((video, vidIdx) => (
                        <div
                          key={video.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                        >
                          <span className="text-sm text-muted-foreground font-mono w-6">
                            {vidIdx + 1}.
                          </span>
                          <div className="relative w-28 h-16 rounded overflow-hidden shrink-0 bg-black">
                            {extractYouTubeId(video.youtubeUrl) ? (
                              <Image
                                src={`https://img.youtube.com/vi/${extractYouTubeId(video.youtubeUrl)}/mqdefault.jpg`}
                                alt={video.title}
                                width={112}
                                height={64}
                                className="w-full h-full object-cover opacity-80"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Play className="h-5 w-5 text-white/50" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{video.title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge className={getStatusBadgeColor(video.status)}>
                                {video.status}
                              </Badge>
                              <Badge variant={video.commentsEnabled ? "default" : "outline"} className="text-xs">
                                {video.commentsEnabled ? "Comments On" : "Comments Off"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <HelpCircle className="h-3 w-3 mr-1" />
                                {video._count?.mcqQuestions ?? 0} MCQs
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingVideoId(video.id);
                                setNewVideo({
                                  title: video.title,
                                  youtubeUrl: video.youtubeUrl,
                                  description: video.description || "",
                                  commentsEnabled: video.commentsEnabled,
                                });
                                setIsEditVideoOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {video.status === "DRAFT" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateVideoStatusMutation.mutate({
                                    id: video.id,
                                    status: "PUBLISHED",
                                  })
                                }
                              >
                                Publish
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateVideoStatusMutation.mutate({
                                    id: video.id,
                                    status: "DRAFT",
                                  })
                                }
                              >
                                Unpublish
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                if (confirm("Delete this video?"))
                                  deleteVideoMutation.mutate(video.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedModuleId(mod.id);
                          setIsVideoOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Video
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card className="text-center py-12">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No modules yet. Add your first module to get started.</p>
            </Card>
          )}
        </div>

        {/* Edit Course Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input className="mt-2" 
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-2" 
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Thumbnail</Label>
                <ImageUpload className="mt-2" 
                  value={editData.thumbnail}
                  onChange={(url) => setEditData({ ...editData, thumbnail: url })}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select 
                  value={editData.type}
                  onValueChange={(v: "PUBLIC" | "PRIVATE") =>
                    setEditData({ ...editData, type: v })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={editData.status}
                  onValueChange={(v: "DRAFT" | "PUBLISHED") =>
                    setEditData({ ...editData, status: v })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => updateMutation.mutate(editData)} disabled={updateMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Module Dialog */}
        <Dialog open={isModuleOpen} onOpenChange={setIsModuleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Module</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Module Title</Label>
                <Input className="mt-2" 
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="e.g., Introduction to React"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => addModuleMutation.mutate({ title: newModuleTitle, courseId })}
                disabled={!newModuleTitle}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Video Dialog */}
        <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Video Title</Label>
                <Input className="mt-2" 
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  placeholder="Video title"
                />
              </div>
              <div>
                <Label>YouTube URL</Label>
                <Input className="mt-2" 
                  value={newVideo.youtubeUrl}
                  onChange={(e) => setNewVideo({ ...newVideo, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Textarea className="mt-2" 
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  placeholder="Optional video description"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Comments</Label>
                <Switch
                  checked={newVideo.commentsEnabled}
                  onCheckedChange={(v) => setNewVideo({ ...newVideo, commentsEnabled: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => addVideoMutation.mutate({ ...newVideo, moduleId: selectedModuleId })}
                disabled={!newVideo.title || !newVideo.youtubeUrl}
              >
                Add Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Video Dialog */}
        <Dialog open={isEditVideoOpen} onOpenChange={setIsEditVideoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Video Title</Label>
                <Input className="mt-2" 
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                />
              </div>
              <div>
                <Label>YouTube URL</Label>
                <Input className="mt-2" 
                  value={newVideo.youtubeUrl}
                  onChange={(e) => setNewVideo({ ...newVideo, youtubeUrl: e.target.value })}
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Textarea className="mt-2" 
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Comments</Label>
                <Switch
                  checked={newVideo.commentsEnabled}
                  onCheckedChange={(v) => setNewVideo({ ...newVideo, commentsEnabled: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  updateVideoMutation.mutate({
                    id: editingVideoId,
                    title: newVideo.title,
                    youtubeUrl: newVideo.youtubeUrl,
                    description: newVideo.description || null,
                    commentsEnabled: newVideo.commentsEnabled,
                  })
                }
                disabled={!newVideo.title || !newVideo.youtubeUrl}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
