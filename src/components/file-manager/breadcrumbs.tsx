"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  bucket: string;
  path: string[];
}

export function Breadcrumbs({ bucket, path }: BreadcrumbsProps) {
  const segments = [
    { name: bucket, href: `/${bucket}` },
    ...path.map((segment, index) => ({
      name: segment,
      href: `/${bucket}/${path.slice(0, index + 1).join("/")}`,
    })),
  ];

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        href="/"
        className="flex items-center rounded p-1 hover:bg-accent"
        title="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => (
        <div key={segment.href} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link
            href={segment.href}
            className={cn(
              "rounded px-1.5 py-0.5 hover:bg-accent",
              index === segments.length - 1 && "font-medium",
            )}
          >
            {segment.name}
          </Link>
        </div>
      ))}
    </nav>
  );
}
