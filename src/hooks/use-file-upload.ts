"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface UseFileUploadOptions {
  bucket: string;
  currentPath: string;
}

export function useFileUpload({ bucket, currentPath }: UseFileUploadOptions) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const queryClient = useQueryClient();

  const uploadFile = useCallback(
    async (file: File) => {
      const key = currentPath ? `${currentPath}/${file.name}` : file.name;
      const uploadId = `${key}-${Date.now()}`;

      setUploads((prev) => [
        ...prev,
        { id: uploadId, file, progress: 0, status: "pending" },
      ]);

      try {
        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId ? { ...item, status: "uploading" } : item,
          ),
        );

        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", bucket);
        formData.append("key", key);

        const response = await fetch("/api/s3/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.done) {
                  setUploads((prev) =>
                    prev.map((item) =>
                      item.id === uploadId
                        ? { ...item, progress: 100, status: "success" }
                        : item,
                    ),
                  );
                  queryClient.invalidateQueries({
                    queryKey: ["objects", bucket],
                  });
                  return;
                }

                if (data.loaded !== undefined && data.total !== undefined) {
                  const progress = Math.round((data.loaded / data.total) * 100);
                  setUploads((prev) =>
                    prev.map((item) =>
                      item.id === uploadId ? { ...item, progress } : item,
                    ),
                  );
                }
              }
            }
          }
        }

        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId
              ? { ...item, progress: 100, status: "success" }
              : item,
          ),
        );

        queryClient.invalidateQueries({ queryKey: ["objects", bucket] });
      } catch (error) {
        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId
              ? {
                  ...item,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : item,
          ),
        );
      }
    },
    [bucket, currentPath, queryClient],
  );

  const uploadFiles = useCallback(
    (files: File[]) => {
      for (const file of files) {
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  const clearCompleted = useCallback(() => {
    setUploads((prev) =>
      prev.filter(
        (item) => item.status !== "success" && item.status !== "error",
      ),
    );
  }, []);

  const clearAll = useCallback(() => {
    setUploads([]);
  }, []);

  const hasUploads = uploads.length > 0;
  const hasActiveUploads = uploads.some(
    (item) => item.status === "pending" || item.status === "uploading",
  );
  const hasCompleted = uploads.some(
    (item) => item.status === "success" || item.status === "error",
  );

  return {
    uploads,
    uploadFiles,
    clearCompleted,
    clearAll,
    hasUploads,
    hasActiveUploads,
    hasCompleted,
  };
}
