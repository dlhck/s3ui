export interface S3Object {
  key: string;
  name: string;
  size?: number;
  lastModified?: Date;
  etag?: string;
  contentType?: string;
  isFolder: boolean;
}

export interface S3Bucket {
  name: string;
  creationDate?: Date;
}

export interface ListObjectsResult {
  objects: S3Object[];
  prefixes: string[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

export interface PresignedUrlResult {
  url: string;
  expiresAt: Date;
}

export type S3OperationError = {
  code: string;
  message: string;
};
