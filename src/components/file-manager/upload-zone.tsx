"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePresignedUrl } from "@/hooks/use-s3";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UploadItem {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface UploadZoneProps {
  bucket: string;
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UploadZone({
  bucket,
  currentPath,
  isOpen,
  onClose,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<Map<string, UploadItem>>(new Map());
  const presignedUrl = usePresignedUrl();
  const queryClient = useQueryClient();

  const uploadFile = useCallback(
    async (file: File) => {
      const key = currentPath ? `${currentPath}/${file.name}` : file.name;
      const uploadKey = `${key}-${Date.now()}`;

      setUploads((prev) => {
        const next = new Map(prev);
        next.set(uploadKey, { file, progress: 0, status: "pending" });
        return next;
      });

      try {
        setUploads((prev) => {
          const next = new Map(prev);
          const item = next.get(uploadKey);
          if (item) {
            next.set(uploadKey, { ...item, status: "uploading" });
          }
          return next;
        });

        const { url } = await presignedUrl.mutateAsync({
          action: "upload",
          bucket,
          key,
          contentType: file.type || "application/octet-stream",
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploads((prev) => {
                const next = new Map(prev);
                const item = next.get(uploadKey);
                if (item) {
                  next.set(uploadKey, { ...item, progress });
                }
                return next;
              });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));

          xhr.open("PUT", url);
          xhr.setRequestHeader(
            "Content-Type",
            file.type || "application/octet-stream"
          );
          xhr.send(file);
        });

        setUploads((prev) => {
          const next = new Map(prev);
          const item = next.get(uploadKey);
          if (item) {
            next.set(uploadKey, { ...item, progress: 100, status: "success" });
          }
          return next;
        });

        queryClient.invalidateQueries({ queryKey: ["objects", bucket] });
      } catch (error) {
        setUploads((prev) => {
          const next = new Map(prev);
          const item = next.get(uploadKey);
          if (item) {
            next.set(uploadKey, {
              ...item,
              status: "error",
              error: error instanceof Error ? error.message : "Upload failed",
            });
          }
          return next;
        });
      }
    },
    [bucket, currentPath, presignedUrl, queryClient]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => uploadFile(file));
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => uploadFile(file));
      e.target.value = "";
    },
    [uploadFile]
  );

  const clearCompleted = useCallback(() => {
    setUploads((prev) => {
      const next = new Map(prev);
      for (const [key, item] of next) {
        if (item.status === "success" || item.status === "error") {
          next.delete(key);
        }
      }
      return next;
    });
  }, []);

  if (!isOpen) return null;

  const uploadList = Array.from(uploads.entries());
  const hasCompleted = uploadList.some(
    ([, item]) => item.status === "success" || item.status === "error"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Files</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          )}
        >
          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">
            Drag and drop files here, or
          </p>
          <div>
            <input
              type="file"
              id="file-upload"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Browse Files
            </Button>
          </div>
        </div>

        {uploadList.length > 0 && (
          <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
            {uploadList.map(([key, item]) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-md bg-muted/50 p-2"
              >
                {item.status === "uploading" && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                )}
                {item.status === "success" && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                )}
                {item.status === "error" && (
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                {item.status === "pending" && (
                  <div className="h-4 w-4 shrink-0" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.file.name}</p>
                  {item.status === "uploading" && (
                    <Progress value={item.progress} className="mt-1 h-1" />
                  )}
                  {item.status === "error" && (
                    <p className="text-xs text-destructive">{item.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasCompleted && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={clearCompleted}>
              Clear Completed
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
