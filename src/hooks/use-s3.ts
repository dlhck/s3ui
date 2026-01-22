"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { S3Bucket, S3Object, ListObjectsResult } from "@/lib/s3/types";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Request failed");
  }
  return response.json();
}

export function useBuckets() {
  return useQuery({
    queryKey: ["buckets"],
    queryFn: () =>
      fetchJson<{ buckets: S3Bucket[] }>("/api/s3/buckets").then(
        (data) => data.buckets
      ),
  });
}

export function useObjects(bucket: string, prefix: string = "") {
  return useQuery({
    queryKey: ["objects", bucket, prefix],
    queryFn: () => {
      const params = new URLSearchParams({ bucket });
      if (prefix) params.set("prefix", prefix);
      return fetchJson<ListObjectsResult>(`/api/s3/objects?${params}`);
    },
    enabled: !!bucket,
  });
}

export function useObjectMetadata(bucket: string, key: string) {
  return useQuery({
    queryKey: ["object", bucket, key],
    queryFn: () =>
      fetchJson<S3Object>(`/api/s3/objects/${bucket}/${encodeURIComponent(key)}`),
    enabled: !!bucket && !!key,
  });
}

export function useObjectContent(bucket: string, key: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["objectContent", bucket, key],
    queryFn: () =>
      fetchJson<{ content: string; contentType?: string }>(
        `/api/s3/objects/${bucket}/${encodeURIComponent(key)}?action=content`
      ),
    enabled: enabled && !!bucket && !!key,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bucket,
      folderPath,
    }: {
      bucket: string;
      folderPath: string;
    }) => {
      return fetchJson<{ success: boolean }>("/api/s3/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createFolder", bucket, folderPath }),
      });
    },
    onSuccess: (_, { bucket }) => {
      queryClient.invalidateQueries({ queryKey: ["objects", bucket] });
    },
  });
}

export function useDeleteObjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bucket, keys }: { bucket: string; keys: string[] }) => {
      return fetchJson<{ success: boolean }>("/api/s3/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", bucket, keys }),
      });
    },
    onSuccess: (_, { bucket }) => {
      queryClient.invalidateQueries({ queryKey: ["objects", bucket] });
    },
  });
}

export function useRenameObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bucket,
      key,
      newKey,
    }: {
      bucket: string;
      key: string;
      newKey: string;
    }) => {
      return fetchJson<{ success: boolean }>(
        `/api/s3/objects/${bucket}/${encodeURIComponent(key)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "rename", newKey }),
        }
      );
    },
    onSuccess: (_, { bucket }) => {
      queryClient.invalidateQueries({ queryKey: ["objects", bucket] });
    },
  });
}

export function useMoveObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bucket,
      key,
      destinationBucket,
      destinationKey,
    }: {
      bucket: string;
      key: string;
      destinationBucket: string;
      destinationKey: string;
    }) => {
      return fetchJson<{ success: boolean }>(
        `/api/s3/objects/${bucket}/${encodeURIComponent(key)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "move",
            destinationBucket,
            destinationKey,
          }),
        }
      );
    },
    onSuccess: (_, { bucket, destinationBucket }) => {
      queryClient.invalidateQueries({ queryKey: ["objects", bucket] });
      if (destinationBucket !== bucket) {
        queryClient.invalidateQueries({
          queryKey: ["objects", destinationBucket],
        });
      }
    },
  });
}

export function useCopyObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bucket,
      key,
      destinationBucket,
      destinationKey,
    }: {
      bucket: string;
      key: string;
      destinationBucket: string;
      destinationKey: string;
    }) => {
      return fetchJson<{ success: boolean }>(
        `/api/s3/objects/${bucket}/${encodeURIComponent(key)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "copy",
            destinationBucket,
            destinationKey,
          }),
        }
      );
    },
    onSuccess: (_, { destinationBucket }) => {
      queryClient.invalidateQueries({
        queryKey: ["objects", destinationBucket],
      });
    },
  });
}

export function usePresignedUrl() {
  return useMutation({
    mutationFn: async ({
      action,
      bucket,
      key,
      contentType,
    }: {
      action: "upload" | "download";
      bucket: string;
      key: string;
      contentType?: string;
    }) => {
      return fetchJson<{ url: string; expiresAt: string }>(
        "/api/s3/presigned",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, bucket, key, contentType }),
        }
      );
    },
  });
}
