"use client";

import { useState } from "react";
import { useCreateFolder } from "@/hooks/use-s3";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CreateFolderDialogProps {
  bucket: string;
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateFolderDialog({
  bucket,
  currentPath,
  isOpen,
  onClose,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const createFolder = useCreateFolder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    const folderPath = currentPath
      ? `${currentPath}/${folderName.trim()}`
      : folderName.trim();

    try {
      await createFolder.mutateAsync({ bucket, folderPath });
      setFolderName("");
      onClose();
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFolderName("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="my-folder"
              className="mt-2"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!folderName.trim() || createFolder.isPending}
            >
              {createFolder.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
