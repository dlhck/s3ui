"use client";

import { useState, useCallback } from "react";
import { useObjects, usePresignedUrl } from "@/hooks/use-s3";
import type { S3Object } from "@/lib/s3/types";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";
import { FileItem } from "./file-item";
import { Toolbar } from "./toolbar";
import { UploadZone } from "./upload-zone";
import { CreateFolderDialog } from "./create-folder-dialog";
import { RenameDialog } from "./rename-dialog";
import { DeleteDialog } from "./delete-dialog";
import { MoveDialog } from "./move-dialog";
import { FilePreview } from "./file-preview";
import { Loader2, FolderOpen } from "lucide-react";

interface FileBrowserProps {
  bucket: string;
  path: string[];
}

export function FileBrowser({ bucket, path }: FileBrowserProps) {
  const currentPath = path.join("/");
  const { data, isLoading, error, refetch, isRefetching } = useObjects(
    bucket,
    currentPath
  );
  const presignedUrl = usePresignedUrl();

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [renameObject, setRenameObject] = useState<S3Object | null>(null);
  const [deleteObjects, setDeleteObjects] = useState<S3Object[]>([]);
  const [moveObject, setMoveObject] = useState<S3Object | null>(null);
  const [moveMode, setMoveMode] = useState<"move" | "copy">("move");
  const [previewObject, setPreviewObject] = useState<S3Object | null>(null);

  const handleSelect = useCallback((key: string, shiftKey: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (shiftKey && next.has(key)) {
        next.delete(key);
      } else if (shiftKey) {
        next.add(key);
      } else {
        if (next.has(key) && next.size === 1) {
          next.clear();
        } else {
          next.clear();
          next.add(key);
        }
      }
      return next;
    });
  }, []);

  const handleDownload = useCallback(
    async (object: S3Object) => {
      try {
        const { url } = await presignedUrl.mutateAsync({
          action: "download",
          bucket,
          key: object.key,
        });
        window.open(url, "_blank");
      } catch (error) {
        console.error("Failed to download:", error);
      }
    },
    [bucket, presignedUrl]
  );

  const handleDeleteSelected = useCallback(() => {
    if (!data) return;
    const objectsToDelete = data.objects.filter((obj) =>
      selectedKeys.has(obj.key)
    );
    if (objectsToDelete.length > 0) {
      setDeleteObjects(objectsToDelete);
    }
  }, [data, selectedKeys]);

  const handleDeleteClose = useCallback(() => {
    setDeleteObjects([]);
    setSelectedKeys(new Set());
  }, []);

  const handleMoveClose = useCallback(() => {
    setMoveObject(null);
  }, []);

  const handleMove = useCallback((object: S3Object) => {
    setMoveMode("move");
    setMoveObject(object);
  }, []);

  const handleCopy = useCallback((object: S3Object) => {
    setMoveMode("copy");
    setMoveObject(object);
  }, []);

  const selectedObjects = data?.objects.filter((obj) =>
    selectedKeys.has(obj.key)
  ) || [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b px-4 py-3">
        <Breadcrumbs bucket={bucket} path={path} />
        <Toolbar
          selectedCount={selectedKeys.size}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateFolder={() => setIsCreateFolderOpen(true)}
          onUpload={() => setIsUploadOpen(true)}
          onDeleteSelected={handleDeleteSelected}
          onRefresh={() => refetch()}
          isRefreshing={isRefetching}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="py-12 text-center text-destructive">
            Failed to load objects. Please try again.
          </div>
        )}

        {data && data.objects.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12" />
            <p>This folder is empty</p>
          </div>
        )}

        {data && data.objects.length > 0 && (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "flex flex-col gap-1"
            )}
          >
            {data.objects.map((object) => (
              <FileItem
                key={object.key}
                object={object}
                bucket={bucket}
                currentPath={currentPath}
                isSelected={selectedKeys.has(object.key)}
                onSelect={handleSelect}
                onPreview={setPreviewObject}
                onDownload={handleDownload}
                onDelete={(obj) => setDeleteObjects([obj])}
                onRename={setRenameObject}
                onMove={handleMove}
                onCopy={handleCopy}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <UploadZone
        bucket={bucket}
        currentPath={currentPath}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <CreateFolderDialog
        bucket={bucket}
        currentPath={currentPath}
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
      />

      <RenameDialog
        bucket={bucket}
        object={renameObject}
        isOpen={!!renameObject}
        onClose={() => setRenameObject(null)}
      />

      <DeleteDialog
        bucket={bucket}
        objects={deleteObjects}
        isOpen={deleteObjects.length > 0}
        onClose={handleDeleteClose}
      />

      <MoveDialog
        bucket={bucket}
        object={moveObject}
        mode={moveMode}
        isOpen={!!moveObject}
        onClose={handleMoveClose}
      />

      <FilePreview
        bucket={bucket}
        object={previewObject}
        isOpen={!!previewObject}
        onClose={() => setPreviewObject(null)}
        onDownload={handleDownload}
      />
    </div>
  );
}
