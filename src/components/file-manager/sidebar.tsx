"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useBuckets } from "@/hooks/use-s3";
import { cn } from "@/lib/utils";
import { Database, HardDrive, Loader2 } from "lucide-react";

export function Sidebar() {
  const { data: buckets, isLoading, error } = useBuckets();
  const params = useParams();
  const pathname = usePathname();
  const currentBucket = params.bucket as string | undefined;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <HardDrive className="h-5 w-5" />
        <span className="font-semibold">S3UI</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground">
          Buckets
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="px-2 py-4 text-sm text-destructive">
            Failed to load buckets
          </div>
        )}

        {buckets && buckets.length === 0 && (
          <div className="px-2 py-4 text-sm text-muted-foreground">
            No buckets found
          </div>
        )}

        <nav className="space-y-1">
          {buckets?.map((bucket) => (
            <Link
              key={bucket.name}
              href={`/${bucket.name}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                currentBucket === bucket.name
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <Database className="h-4 w-4 shrink-0" />
              <span className="truncate">{bucket.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
