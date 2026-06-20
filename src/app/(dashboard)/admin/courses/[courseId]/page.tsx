"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Play, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
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
  const [selectedModuleId, setSelectedModuleId] = useState("");
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
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

        <p className="text-muted-foreground">
          {data.description || "No description"}
        </p>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Modules</h2>
          <Button onClick={() => setIsModuleOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Module
          </Button>
        </div>

        <Tabs defaultValue={data.modules[0]?.id || ""}>
          <TabsList className="w-full justify-start flex-wrap h-auto">
            {data.modules.map((mod) => (
              <TabsTrigger key={mod.id} value={mod.id}>
                {mod.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {data.modules.map((mod) => (
            <TabsContent key={mod.id} value={mod.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{mod.title}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedModuleId(mod.id);
                      setIsVideoOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Video
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this module?"))
                        deleteModuleMutation.mutate(mod.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {mod.videos.map((video) => (
                  <Card key={video.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="relative w-40 h-24 rounded-md overflow-hidden shrink-0 bg-muted">
                        {extractYouTubeId(video.youtubeUrl) && (
                          <Image
                            src={`https://img.youtube.com/vi/${extractYouTubeId(video.youtubeUrl)}/mqdefault.jpg`}
                            alt={video.title}
                            width={160}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{video.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {video.description || "No description"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusBadgeColor(video.status)}>
                            {video.status}
                          </Badge>
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
                          <Badge
                            variant={
                              video.commentsEnabled ? "success" : "outline"
                            }
                          >
                            Comments {video.commentsEnabled ? "On" : "Off"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this video?"))
                            deleteVideoMutation.mutate(video.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
          {data.modules.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-muted-foreground">
                No modules yet. Add your first module!
              </p>
            </Card>
          )}
        </Tabs>

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
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-2" 
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Thumbnail</Label>
                <ImageUpload className="mt-2" 
                  value={editData.thumbnail}
                  onChange={(url) =>
                    setEditData({ ...editData, thumbnail: url })
                  }
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
              <Button
                onClick={() => updateMutation.mutate(editData)}
                disabled={updateMutation.isPending}
              >
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
                onClick={() =>
                  addModuleMutation.mutate({ title: newModuleTitle, courseId })
                }
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
                  onChange={(e) =>
                    setNewVideo({ ...newVideo, title: e.target.value })
                  }
                  placeholder="Video title"
                />
              </div>
              <div>
                <Label>YouTube URL</Label>
                <Input className="mt-2" 
                  value={newVideo.youtubeUrl}
                  onChange={(e) =>
                    setNewVideo({ ...newVideo, youtubeUrl: e.target.value })
                  }
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Textarea className="mt-2" 
                  value={newVideo.description}
                  onChange={(e) =>
                    setNewVideo({ ...newVideo, description: e.target.value })
                  }
                  placeholder="Optional video description"
                />
              </div>
              <div>
                <Label>Enable Comments</Label>
                <Switch className="mt-2" 
                  checked={newVideo.commentsEnabled}
                  onCheckedChange={(v) =>
                    setNewVideo({ ...newVideo, commentsEnabled: v })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  addVideoMutation.mutate({
                    ...newVideo,
                    moduleId: selectedModuleId,
                  })
                }
                disabled={!newVideo.title || !newVideo.youtubeUrl}
              >
                Add Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
