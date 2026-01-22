"use client";

import { useEffect, useState } from "react";
import { useObjectContent, usePresignedUrl } from "@/hooks/use-s3";
import type { S3Object } from "@/lib/s3/types";
import { format } from "date-fns";
import { filesize } from "filesize";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Loader2, X } from "lucide-react";

interface FilePreviewProps {
  bucket: string;
  object: S3Object | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (object: S3Object) => void;
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "bmp"];
const TEXT_EXTENSIONS = [
  "txt",
  "md",
  "markdown",
  "json",
  "yaml",
  "yml",
  "xml",
  "html",
  "css",
  "js",
  "ts",
  "jsx",
  "tsx",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "c",
  "cpp",
  "h",
  "php",
  "sh",
  "bash",
  "zsh",
  "sql",
  "env",
  "gitignore",
  "dockerignore",
];
const PDF_EXTENSIONS = ["pdf"];

function getFileType(
  name: string
): "image" | "text" | "pdf" | "unknown" {
  const ext = name.split(".").pop()?.toLowerCase() || "";

  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (TEXT_EXTENSIONS.includes(ext)) return "text";
  if (PDF_EXTENSIONS.includes(ext)) return "pdf";

  return "unknown";
}

export function FilePreview({
  bucket,
  object,
  isOpen,
  onClose,
  onDownload,
}: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const presignedUrl = usePresignedUrl();

  const fileType = object ? getFileType(object.name) : "unknown";
  const showTextContent = fileType === "text";

  const { data: textContent, isLoading: isLoadingText } = useObjectContent(
    bucket,
    object?.key || "",
    isOpen && showTextContent && !!object
  );

  useEffect(() => {
    if (!isOpen || !object) {
      setPreviewUrl(null);
      return;
    }

    if (fileType === "image" || fileType === "pdf") {
      presignedUrl
        .mutateAsync({
          action: "download",
          bucket,
          key: object.key,
        })
        .then(({ url }) => {
          setPreviewUrl(url);
        })
        .catch(console.error);
    }

    return () => {
      setPreviewUrl(null);
    };
  }, [isOpen, object, bucket, fileType]);

  if (!object) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <DialogTitle className="truncate pr-4">{object.name}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(object)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {object.size !== undefined && (
              <span>Size: {filesize(object.size)}</span>
            )}
            {object.lastModified && (
              <span>
                Modified:{" "}
                {format(new Date(object.lastModified), "MMM d, yyyy HH:mm")}
              </span>
            )}
            {object.contentType && <span>Type: {object.contentType}</span>}
          </div>

          {/* Preview Content */}
          <div className="max-h-[60vh] overflow-auto rounded-lg border bg-muted/30">
            {fileType === "image" && (
              <div className="flex items-center justify-center p-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={object.name}
                    className="max-h-[50vh] max-w-full object-contain"
                  />
                ) : (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                )}
              </div>
            )}

            {fileType === "text" && (
              <div className="p-4">
                {isLoadingText ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm">
                    {textContent?.content || ""}
                  </pre>
                )}
              </div>
            )}

            {fileType === "pdf" && (
              <div className="h-[50vh]">
                {previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="h-full w-full"
                    title={object.name}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            )}

            {fileType === "unknown" && (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
                <p>Preview not available for this file type</p>
                <Button
                  variant="outline"
                  onClick={() => onDownload(object)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download to view
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
