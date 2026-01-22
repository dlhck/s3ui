"use client";

import { format } from "date-fns";
import { filesize } from "filesize";
import {
  Copy,
  Download,
  Eye,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  MoreVertical,
  Move,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { S3Object } from "@/lib/s3/types";
import { cn } from "@/lib/utils";

interface FileItemProps {
  object: S3Object;
  bucket: string;
  currentPath: string;
  isSelected: boolean;
  onSelect: (key: string, shiftKey: boolean) => void;
  onPreview: (object: S3Object) => void;
  onDownload: (object: S3Object) => void;
  onDelete: (object: S3Object) => void;
  onRename: (object: S3Object) => void;
  onMove: (object: S3Object) => void;
  onCopy: (object: S3Object) => void;
}

function getFileIcon(name: string, isFolder: boolean) {
  if (isFolder) return Folder;

  const ext = name.split(".").pop()?.toLowerCase();

  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "bmp"];
  const textExts = ["txt", "md", "markdown", "rtf"];
  const videoExts = ["mp4", "webm", "mov", "avi", "mkv"];
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac"];
  const archiveExts = ["zip", "tar", "gz", "rar", "7z"];
  const codeExts = [
    "js",
    "ts",
    "jsx",
    "tsx",
    "html",
    "css",
    "json",
    "yaml",
    "yml",
    "xml",
    "py",
    "rb",
    "go",
    "rs",
    "java",
    "c",
    "cpp",
    "h",
    "php",
  ];

  if (ext && imageExts.includes(ext)) return FileImage;
  if (ext && textExts.includes(ext)) return FileText;
  if (ext && videoExts.includes(ext)) return FileVideo;
  if (ext && audioExts.includes(ext)) return FileAudio;
  if (ext && archiveExts.includes(ext)) return FileArchive;
  if (ext && codeExts.includes(ext)) return FileCode;

  return File;
}

export function FileItem({
  object,
  bucket,
  currentPath,
  isSelected,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
  onRename,
  onMove,
  onCopy,
}: FileItemProps) {
  const Icon = getFileIcon(object.name, object.isFolder);

  const href = object.isFolder
    ? `/${bucket}/${object.key.replace(/\/$/, "")}`
    : undefined;

  const handleClick = (e: React.MouseEvent) => {
    if (!object.isFolder) {
      e.preventDefault();
      onSelect(object.key, e.shiftKey);
    }
  };

  const handleDoubleClick = () => {
    if (!object.isFolder) {
      onPreview(object);
    }
  };

  const content = (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md border px-3 py-2 transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-accent/50",
        object.isFolder && "cursor-pointer",
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <Icon
        className={cn(
          "h-8 w-8 shrink-0",
          object.isFolder ? "text-blue-500" : "text-muted-foreground",
        )}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{object.name}</p>
        {!object.isFolder && (
          <p className="text-xs text-muted-foreground">
            {object.size !== undefined && filesize(object.size)}
            {object.size !== undefined && object.lastModified && " • "}
            {object.lastModified &&
              format(new Date(object.lastModified), "MMM d, yyyy HH:mm")}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex h-8 w-8 items-center justify-center rounded-md opacity-0 hover:bg-accent group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!object.isFolder && (
            <>
              <DropdownMenuItem onClick={() => onPreview(object)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(object)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => onRename(object)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMove(object)}>
            <Move className="mr-2 h-4 w-4" />
            Move
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCopy(object)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(object)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
