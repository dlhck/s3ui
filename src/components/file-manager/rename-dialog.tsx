"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { useRenameObject } from "@/hooks/use-s3";
import type { S3Object } from "@/lib/s3/types";

interface RenameDialogProps {
  bucket: string;
  object: S3Object | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Extract the base name and extension from a filename.
 * Handles edge cases like hidden files (.gitignore) and files without extensions.
 */
function splitFilename(filename: string): {
  baseName: string;
  extension: string;
} {
  // Hidden files without extension (e.g., .gitignore, .env)
  if (filename.startsWith(".") && !filename.slice(1).includes(".")) {
    return { baseName: filename, extension: "" };
  }

  const lastDotIndex = filename.lastIndexOf(".");

  // No extension
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return { baseName: filename, extension: "" };
  }

  return {
    baseName: filename.slice(0, lastDotIndex),
    extension: filename.slice(lastDotIndex), // includes the dot
  };
}

export function RenameDialog({
  bucket,
  object,
  isOpen,
  onClose,
}: RenameDialogProps) {
  const [baseName, setBaseName] = useState("");
  const [extension, setExtension] = useState("");
  const [editExtension, setEditExtension] = useState(false);
  const [fullName, setFullName] = useState("");
  const renameObject = useRenameObject();

  useEffect(() => {
    if (object) {
      const { baseName: base, extension: ext } = splitFilename(object.name);
      setBaseName(base);
      setExtension(ext);
      setFullName(object.name);
      setEditExtension(false);
    }
  }, [object]);

  const getNewName = () => {
    if (object?.isFolder) {
      return baseName.trim();
    }
    if (editExtension) {
      return fullName.trim();
    }
    return baseName.trim() + extension;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!object) return;

    const newName = getNewName();
    if (!newName) return;

    // Calculate new key by replacing the old name with the new name
    const keyParts = object.key.split("/");
    keyParts[keyParts.length - (object.isFolder ? 2 : 1)] = newName;
    const newKey = object.isFolder ? keyParts.join("/") : keyParts.join("/");

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

  const isFile = object && !object.isFolder;
  const hasExtension = extension !== "";
  const currentValue = editExtension ? fullName : baseName;
  const isValid = getNewName().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Rename {object?.isFolder ? "Folder" : "File"}
            </DialogTitle>
            <DialogDescription>
              Enter a new name for {object?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div>
              <Label htmlFor="newName">New Name</Label>
              {isFile && hasExtension && !editExtension ? (
                <InputGroup className="mt-2">
                  <InputGroupInput
                    id="newName"
                    value={baseName}
                    onChange={(e) => {
                      setBaseName(e.target.value);
                      setFullName(e.target.value + extension);
                    }}
                    autoFocus
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>{extension}</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              ) : (
                <Input
                  id="newName"
                  value={currentValue}
                  onChange={(e) => {
                    if (editExtension) {
                      setFullName(e.target.value);
                    } else {
                      setBaseName(e.target.value);
                      setFullName(e.target.value);
                    }
                  }}
                  className="mt-2"
                  autoFocus
                />
              )}
            </div>

            {isFile && hasExtension && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="editExtension"
                  checked={editExtension}
                  onCheckedChange={(checked) => {
                    setEditExtension(checked === true);
                    if (checked) {
                      setFullName(baseName + extension);
                    }
                  }}
                />
                <Label
                  htmlFor="editExtension"
                  className="text-sm font-normal cursor-pointer"
                >
                  Edit file extension
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || renameObject.isPending}>
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
