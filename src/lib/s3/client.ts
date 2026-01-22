import { S3Client } from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const endpoint = process.env.S3_ENDPOINT_URL;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

  s3Client = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    ...(endpoint && { endpoint }),
    forcePathStyle,
  });

  return s3Client;
}

export function getAllowedBuckets(): string[] | null {
  const buckets = process.env.S3_ALLOWED_BUCKETS;
  if (!buckets || buckets.trim() === "") {
    return null; // null means all buckets are allowed
  }
  return buckets.split(",").map((b) => b.trim()).filter(Boolean);
}
