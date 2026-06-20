"use client";

import { useState, useRef, useCallback } from "react";
import { ImageKitProvider, upload } from "@imagekit/next";
import { X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

const IMAGEKIT_URL = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";
const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      const previousUrl = value;
      setIsUploading(true);
      try {
        const authRes = await fetch("/api/imagekit");
        const { token, expire, signature } = await authRes.json();

        const result = await upload({
          file,
          fileName: file.name,
          tags: ["course-thumbnail"],
          useUniqueFileName: true,
          publicKey: IMAGEKIT_PUBLIC_KEY,
          token,
          expire,
          signature,
        });
        if (result.url) {
          onChange(result.url);
          toast.success("Thumbnail uploaded");
        }

        if (previousUrl && previousUrl.startsWith(IMAGEKIT_URL)) {
          fetch("/api/imagekit/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: previousUrl }),
          }).catch(() => {});
        }
      } catch {
        toast.error("Upload failed");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [value, onChange]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  }

  return (
    <ImageKitProvider urlEndpoint={IMAGEKIT_URL}>
      <div className={cn("space-y-2", className)}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {value ? (
          <div className="relative w-full h-40 rounded-md overflow-hidden bg-muted group">
            <Image src={value} alt="Thumbnail" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 hover:bg-white text-black rounded-md px-3 py-1.5 text-sm font-medium"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="bg-red-500/90 hover:bg-red-500 text-white rounded-md p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative w-full h-40 rounded-md border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-2",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-primary/50 bg-muted/50"
            )}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="p-3 rounded-full bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Drag & drop or <span className="text-primary">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    SVG, PNG, JPG or GIF (max 5MB)
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {isUploading && (
          <p className="text-xs text-center text-muted-foreground">Uploading thumbnail...</p>
        )}
      </div>
    </ImageKitProvider>
  );
}
