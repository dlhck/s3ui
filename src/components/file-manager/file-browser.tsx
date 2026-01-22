"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import { FolderOpen, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useObjects, usePresignedUrl } from "@/hooks/use-s3";
import type { S3Object } from "@/lib/s3/types";
import { Breadcrumbs } from "./breadcrumbs";
import { type ColumnActions, createColumns } from "./columns";
import { CreateFolderDialog } from "./create-folder-dialog";
import { DataTable } from "./data-table";
import { DeleteDialog } from "./delete-dialog";
import { DropzoneWrapper } from "./dropzone-wrapper";
import { FileItem } from "./file-item";
import { FilePreview } from "./file-preview";
import { MoveDialog } from "./move-dialog";
import { RenameDialog } from "./rename-dialog";
import { Toolbar } from "./toolbar";
import { UploadProgressPanel } from "./upload-progress-panel";

interface FileBrowserProps {
  bucket: string;
  path: string[];
}

export function FileBrowser({ bucket, path }: FileBrowserProps) {
  const router = useRouter();
  const currentPath = path.join("/");
  const { data, isLoading, error, refetch, isRefetching } = useObjects(
    bucket,
    currentPath,
  );
  const presignedUrl = usePresignedUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploads,
    uploadFiles,
    clearCompleted,
    clearAll,
    hasUploads,
    hasCompleted,
  } = useFileUpload({ bucket, currentPath });

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [renameObject, setRenameObject] = useState<S3Object | null>(null);
  const [deleteObjects, setDeleteObjects] = useState<S3Object[]>([]);
  const [moveObject, setMoveObject] = useState<S3Object | null>(null);
  const [moveMode, setMoveMode] = useState<"move" | "copy">("move");
  const [previewObject, setPreviewObject] = useState<S3Object | null>(null);

  const selectedKeys = useMemo(() => {
    return new Set(
      Object.keys(rowSelection).filter((key) => rowSelection[key]),
    );
  }, [rowSelection]);

  const handleSelect = useCallback((key: string, shiftKey: boolean) => {
    setRowSelection((prev) => {
      const isSelected = prev[key];
      if (shiftKey && isSelected) {
        const next = { ...prev };
        delete next[key];
        return next;
      } else if (shiftKey) {
        return { ...prev, [key]: true };
      } else {
        if (isSelected && Object.keys(prev).length === 1) {
          return {};
        } else {
          return { [key]: true };
        }
      }
    });
  }, []);

  const handleNavigate = useCallback(
    (object: S3Object) => {
      if (object.isFolder) {
        router.push(`/${bucket}/${object.key.replace(/\/$/, "")}`);
      }
    },
    [bucket, router],
  );

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
    [bucket, presignedUrl],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!data) return;
    const objectsToDelete = data.objects.filter((obj) =>
      selectedKeys.has(obj.key),
    );
    if (objectsToDelete.length > 0) {
      setDeleteObjects(objectsToDelete);
    }
  }, [data, selectedKeys]);

  const handleDeleteClose = useCallback(() => {
    setDeleteObjects([]);
    setRowSelection({});
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

  const handleRowDoubleClick = useCallback(
    (object: S3Object) => {
      if (object.isFolder) {
        handleNavigate(object);
      } else {
        setPreviewObject(object);
      }
    },
    [handleNavigate],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        uploadFiles(files);
      }
      e.target.value = "";
    },
    [uploadFiles],
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const columnActions: ColumnActions = useMemo(
    () => ({
      onPreview: setPreviewObject,
      onDownload: handleDownload,
      onDelete: (obj) => setDeleteObjects([obj]),
      onRename: setRenameObject,
      onMove: handleMove,
      onCopy: handleCopy,
      onNavigate: handleNavigate,
    }),
    [handleDownload, handleMove, handleCopy, handleNavigate],
  );

  const columns = useMemo(() => createColumns(columnActions), [columnActions]);

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
          onUpload={handleUploadClick}
          onDeleteSelected={handleDeleteSelected}
          onRefresh={() => refetch()}
          isRefreshing={isRefetching}
        />
      </div>

      {/* Content */}
      <DropzoneWrapper
        className="flex-1 overflow-y-auto p-4"
        onFilesDropped={uploadFiles}
      >
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

        {data && data.objects.length === 0 && viewMode === "grid" && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12" />
            <p>This folder is empty</p>
          </div>
        )}

        {data && viewMode === "list" && (
          <DataTable
            columns={columns}
            data={data.objects}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onRowDoubleClick={handleRowDoubleClick}
          />
        )}

        {data && data.objects.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
      </DropzoneWrapper>

      {/* Hidden file input for toolbar upload button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Dialogs */}
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

      {/* Upload progress panel */}
      {hasUploads && (
        <UploadProgressPanel
          uploads={uploads}
          onClearCompleted={clearCompleted}
          onClearAll={clearAll}
          hasCompleted={hasCompleted}
        />
      )}
    </div>
  );
}
