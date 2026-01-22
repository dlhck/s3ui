"use client";

import {
  FolderPlus,
  LayoutGrid,
  List,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolbarProps {
  selectedCount: number;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onCreateFolder: () => void;
  onUpload: () => void;
  onDeleteSelected: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Toolbar({
  selectedCount,
  viewMode,
  onViewModeChange,
  onCreateFolder,
  onUpload,
  onDeleteSelected,
  onRefresh,
  isRefreshing,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onUpload}>
        <Upload className="mr-2 h-4 w-4" />
        Upload
      </Button>

      <Button variant="outline" size="sm" onClick={onCreateFolder}>
        <FolderPlus className="mr-2 h-4 w-4" />
        New Folder
      </Button>

      {selectedCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteSelected}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete ({selectedCount})
        </Button>
      )}

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
        />
      </Button>

      <div className="flex rounded-md border">
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8 rounded-r-none"
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8 rounded-l-none"
          onClick={() => onViewModeChange("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
