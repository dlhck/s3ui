"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBuckets, useCopyObject, useMoveObject } from "@/hooks/use-s3";
import type { S3Object } from "@/lib/s3/types";

interface MoveDialogProps {
  bucket: string;
  object: S3Object | null;
  mode: "move" | "copy";
  isOpen: boolean;
  onClose: () => void;
}

export function MoveDialog({
  bucket,
  object,
  mode,
  isOpen,
  onClose,
}: MoveDialogProps) {
  const [destinationBucket, setDestinationBucket] = useState(bucket);
  const [destinationPath, setDestinationPath] = useState("");
  const { data: buckets } = useBuckets();
  const moveObject = useMoveObject();
  const copyObject = useCopyObject();

  const mutation = mode === "move" ? moveObject : copyObject;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!object) return;

    const fileName = object.name;
    const destinationKey = destinationPath
      ? `${destinationPath}/${fileName}`
      : fileName;

    try {
      await mutation.mutateAsync({
        bucket,
        key: object.key,
        destinationBucket,
        destinationKey: object.isFolder ? `${destinationKey}/` : destinationKey,
      });
      onClose();
    } catch (error) {
      console.error(`Failed to ${mode}:`, error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDestinationBucket(bucket);
      setDestinationPath("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "move" ? "Move" : "Copy"}{" "}
              {object?.isFolder ? "Folder" : "File"}
            </DialogTitle>
            <DialogDescription>
              Select the destination for {object?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="destinationBucket">Destination Bucket</Label>
              <Select
                value={destinationBucket}
                onValueChange={(value) => value && setDestinationBucket(value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buckets?.map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="destinationPath">
                Destination Path (optional)
              </Label>
              <Input
                id="destinationPath"
                value={destinationPath}
                onChange={(e) => setDestinationPath(e.target.value)}
                placeholder="folder/subfolder"
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty to {mode} to bucket root
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "move" ? "Move" : "Copy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
