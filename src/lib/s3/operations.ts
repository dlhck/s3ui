import {
  ListBucketsCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getAllowedBuckets } from "./client";
import type {
  S3Bucket,
  S3Object,
  ListObjectsResult,
  PresignedUrlResult,
} from "./types";

const PRESIGNED_URL_EXPIRY = 3600; // 1 hour

export async function listBuckets(): Promise<S3Bucket[]> {
  const client = getS3Client();
  const command = new ListBucketsCommand({});
  const response = await client.send(command);

  const allowedBuckets = getAllowedBuckets();
  const buckets = (response.Buckets || []).map((bucket) => ({
    name: bucket.Name || "",
    creationDate: bucket.CreationDate,
  }));

  if (allowedBuckets) {
    return buckets.filter((b) => allowedBuckets.includes(b.name));
  }

  return buckets;
}

export async function listObjects(
  bucket: string,
  prefix: string = "",
  continuationToken?: string
): Promise<ListObjectsResult> {
  const client = getS3Client();

  // Ensure prefix ends with / if it's not empty (to list folder contents)
  const normalizedPrefix = prefix && !prefix.endsWith("/") ? `${prefix}/` : prefix;

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: normalizedPrefix,
    Delimiter: "/",
    MaxKeys: 1000,
    ContinuationToken: continuationToken,
  });

  const response = await client.send(command);

  const objects: S3Object[] = (response.Contents || [])
    .filter((obj) => obj.Key !== normalizedPrefix) // Filter out the prefix itself
    .map((obj) => {
      const key = obj.Key || "";
      const name = key.slice(normalizedPrefix.length);
      return {
        key,
        name,
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag,
        isFolder: false,
      };
    });

  // Add folders (common prefixes)
  const folders: S3Object[] = (response.CommonPrefixes || []).map((prefix) => {
    const key = prefix.Prefix || "";
    const name = key.slice(normalizedPrefix.length).replace(/\/$/, "");
    return {
      key,
      name,
      isFolder: true,
    };
  });

  return {
    objects: [...folders, ...objects],
    prefixes: response.CommonPrefixes?.map((p) => p.Prefix || "") || [],
    isTruncated: response.IsTruncated || false,
    nextContinuationToken: response.NextContinuationToken,
  };
}

export async function getObjectMetadata(
  bucket: string,
  key: string
): Promise<S3Object> {
  const client = getS3Client();
  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);
  const name = key.split("/").pop() || key;

  return {
    key,
    name,
    size: response.ContentLength,
    lastModified: response.LastModified,
    etag: response.ETag,
    contentType: response.ContentType,
    isFolder: false,
  };
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await client.send(command);
}

export async function deleteObjects(
  bucket: string,
  keys: string[]
): Promise<void> {
  const client = getS3Client();
  const command = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
      Quiet: true,
    },
  });
  await client.send(command);
}

export async function copyObject(
  sourceBucket: string,
  sourceKey: string,
  destinationBucket: string,
  destinationKey: string
): Promise<void> {
  const client = getS3Client();
  const command = new CopyObjectCommand({
    Bucket: destinationBucket,
    Key: destinationKey,
    CopySource: encodeURIComponent(`${sourceBucket}/${sourceKey}`),
  });
  await client.send(command);
}

export async function moveObject(
  sourceBucket: string,
  sourceKey: string,
  destinationBucket: string,
  destinationKey: string
): Promise<void> {
  await copyObject(sourceBucket, sourceKey, destinationBucket, destinationKey);
  await deleteObject(sourceBucket, sourceKey);
}

export async function createFolder(
  bucket: string,
  folderPath: string
): Promise<void> {
  const client = getS3Client();
  const key = folderPath.endsWith("/") ? folderPath : `${folderPath}/`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: "",
  });
  await client.send(command);
}

export async function renameObject(
  bucket: string,
  oldKey: string,
  newKey: string
): Promise<void> {
  await moveObject(bucket, oldKey, bucket, newKey);
}

export async function getUploadPresignedUrl(
  bucket: string,
  key: string,
  contentType?: string
): Promise<PresignedUrlResult> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
  });

  return {
    url,
    expiresAt: new Date(Date.now() + PRESIGNED_URL_EXPIRY * 1000),
  };
}

export async function getDownloadPresignedUrl(
  bucket: string,
  key: string
): Promise<PresignedUrlResult> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
  });

  return {
    url,
    expiresAt: new Date(Date.now() + PRESIGNED_URL_EXPIRY * 1000),
  };
}

export async function getObjectContent(
  bucket: string,
  key: string
): Promise<{ content: string; contentType?: string }> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);
  const content = await response.Body?.transformToString();

  return {
    content: content || "",
    contentType: response.ContentType,
  };
}
