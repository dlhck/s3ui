import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
} from "@/lib/s3/operations";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { action, bucket, key, contentType } = body;

    if (!bucket || !key) {
      return NextResponse.json(
        { error: "Bucket and key are required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "upload": {
        const result = await getUploadPresignedUrl(bucket, key, contentType);
        return NextResponse.json(result);
      }

      case "download": {
        const result = await getDownloadPresignedUrl(bucket, key);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'upload' or 'download'" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
