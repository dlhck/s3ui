import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import {
  listObjects,
  createFolder,
  deleteObjects,
} from "@/lib/s3/operations";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get("bucket");
    const prefix = searchParams.get("prefix") || "";
    const continuationToken = searchParams.get("continuationToken") || undefined;

    if (!bucket) {
      return NextResponse.json(
        { error: "Bucket is required" },
        { status: 400 }
      );
    }

    const result = await listObjects(bucket, prefix, continuationToken);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing objects:", error);
    return NextResponse.json(
      { error: "Failed to list objects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { action, bucket, ...params } = body;

    if (!bucket) {
      return NextResponse.json(
        { error: "Bucket is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "createFolder": {
        const { folderPath } = params;
        if (!folderPath) {
          return NextResponse.json(
            { error: "Folder path is required" },
            { status: 400 }
          );
        }
        await createFolder(bucket, folderPath);
        return NextResponse.json({ success: true });
      }

      case "delete": {
        const { keys } = params;
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
          return NextResponse.json(
            { error: "Keys are required" },
            { status: 400 }
          );
        }
        await deleteObjects(bucket, keys);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
