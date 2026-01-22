"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { filesize } from "filesize";
import {
  ArrowUpDown,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { S3Object } from "@/lib/s3/types";
import { cn } from "@/lib/utils";

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

export interface ColumnActions {
  onPreview: (object: S3Object) => void;
  onDownload: (object: S3Object) => void;
  onDelete: (object: S3Object) => void;
  onRename: (object: S3Object) => void;
  onMove: (object: S3Object) => void;
  onCopy: (object: S3Object) => void;
  onNavigate: (object: S3Object) => void;
}

export function createColumns(actions: ColumnActions): ColumnDef<S3Object>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const object = row.original;
        const Icon = getFileIcon(object.name, object.isFolder);

        return (
          <div
            className={cn(
              "flex items-center gap-2",
              object.isFolder && "cursor-pointer",
            )}
            onClick={() => object.isFolder && actions.onNavigate(object)}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0",
                object.isFolder ? "text-blue-500" : "text-muted-foreground",
              )}
            />
            <span className="truncate">{object.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "size",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Size
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const object = row.original;
        if (object.isFolder)
          return <span className="text-muted-foreground">—</span>;
        return object.size !== undefined ? filesize(object.size) : "—";
      },
    },
    {
      accessorKey: "lastModified",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Last Modified
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const object = row.original;
        if (!object.lastModified)
          return <span className="text-muted-foreground">—</span>;
        return format(new Date(object.lastModified), "MMM d, yyyy HH:mm");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const object = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!object.isFolder && (
                <>
                  <DropdownMenuItem onClick={() => actions.onPreview(object)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onDownload(object)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => actions.onRename(object)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onMove(object)}>
                <Move className="mr-2 h-4 w-4" />
                Move
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onCopy(object)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => actions.onDelete(object)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 50,
    },
  ];
}
