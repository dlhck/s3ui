"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteObjects } from "@/hooks/use-s3";
import type { S3Object } from "@/lib/s3/types";

interface DeleteDialogProps {
  bucket: string;
  objects: S3Object[];
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteDialog({
  bucket,
  objects,
  isOpen,
  onClose,
}: DeleteDialogProps) {
  const deleteObjects = useDeleteObjects();

  const handleDelete = async () => {
    const keys = objects.map((obj) => obj.key);
    try {
      await deleteObjects.mutateAsync({ bucket, keys });
      onClose();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const itemCount = objects.length;
  const folderCount = objects.filter((obj) => obj.isFolder).length;
  const fileCount = itemCount - folderCount;

  let description = "";
  if (fileCount > 0 && folderCount > 0) {
    description = `${fileCount} file${fileCount !== 1 ? "s" : ""} and ${folderCount} folder${folderCount !== 1 ? "s" : ""}`;
  } else if (fileCount > 0) {
    description = `${fileCount} file${fileCount !== 1 ? "s" : ""}`;
  } else {
    description = `${folderCount} folder${folderCount !== 1 ? "s" : ""}`;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {itemCount > 1 ? "Items" : "Item"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {description}? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteObjects.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteObjects.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
