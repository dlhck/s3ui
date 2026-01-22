"use client";

import { useState, useEffect } from "react";
import { useRenameObject } from "@/hooks/use-s3";
import type { S3Object } from "@/lib/s3/types";
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

interface RenameDialogProps {
  bucket: string;
  object: S3Object | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RenameDialog({
  bucket,
  object,
  isOpen,
  onClose,
}: RenameDialogProps) {
  const [newName, setNewName] = useState("");
  const renameObject = useRenameObject();

  useEffect(() => {
    if (object) {
      setNewName(object.name);
    }
  }, [object]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!object || !newName.trim()) return;

    // Calculate new key by replacing the old name with the new name
    const keyParts = object.key.split("/");
    keyParts[keyParts.length - (object.isFolder ? 2 : 1)] = newName.trim();
    const newKey = object.isFolder
      ? keyParts.join("/")
      : keyParts.join("/");

    try {
      await renameObject.mutateAsync({
        bucket,
        key: object.key,
        newKey: object.isFolder ? `${newKey}/` : newKey,
      });
      onClose();
    } catch (error) {
      console.error("Failed to rename:", error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename {object?.isFolder ? "Folder" : "File"}</DialogTitle>
            <DialogDescription>
              Enter a new name for {object?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="newName">New Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
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
              disabled={!newName.trim() || renameObject.isPending}
            >
              {renameObject.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
