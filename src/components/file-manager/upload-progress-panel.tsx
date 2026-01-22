"use client";

import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { UploadItem } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

interface UploadProgressPanelProps {
  uploads: UploadItem[];
  onClearCompleted: () => void;
  onClearAll: () => void;
  hasCompleted: boolean;
}

export function UploadProgressPanel({
  uploads,
  onClearCompleted,
  onClearAll,
  hasCompleted,
}: UploadProgressPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (uploads.length === 0) return null;

  const activeCount = uploads.filter(
    (item) => item.status === "pending" || item.status === "uploading",
  ).length;
  const completedCount = uploads.filter(
    (item) => item.status === "success",
  ).length;
  const errorCount = uploads.filter((item) => item.status === "error").length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 overflow-hidden rounded-lg border bg-background shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {activeCount > 0 && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          <span className="text-sm font-medium">
            {activeCount > 0
              ? `Uploading ${activeCount} file${activeCount > 1 ? "s" : ""}`
              : `${completedCount} upload${completedCount !== 1 ? "s" : ""} complete`}
          </span>
          {errorCount > 0 && (
            <span className="text-xs text-destructive">
              ({errorCount} failed)
            </span>
          )}
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 text-muted-foreground transition-transform",
              isCollapsed && "-rotate-180",
            )}
          />
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-1 h-6 w-6"
          onClick={onClearAll}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <>
          <div className="max-h-60 overflow-y-auto">
            {uploads.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
              >
                {item.status === "uploading" && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                )}
                {item.status === "success" && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                )}
                {item.status === "error" && (
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                {item.status === "pending" && (
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.file.name}</p>
                  {item.status === "uploading" && (
                    <Progress value={item.progress} className="mt-1" />
                  )}
                  {item.status === "error" && (
                    <p className="truncate text-xs text-destructive">
                      {item.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {hasCompleted && (
            <div className="border-t bg-muted/30 px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full text-xs"
                onClick={onClearCompleted}
              >
                Clear completed
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
