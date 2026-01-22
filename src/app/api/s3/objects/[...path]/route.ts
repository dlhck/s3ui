import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import {
  getObjectMetadata,
  deleteObject,
  renameObject,
  copyObject,
  moveObject,
  getObjectContent,
} from "@/lib/s3/operations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    await requireAuth();

    const { path } = await params;
    if (!path || path.length < 2) {
      return NextResponse.json(
        { error: "Bucket and key are required" },
        { status: 400 }
      );
    }

    const [bucket, ...keyParts] = path;
    const key = keyParts.join("/");

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "content") {
      const { content, contentType } = await getObjectContent(bucket, key);
      return NextResponse.json({ content, contentType });
    }

    const metadata = await getObjectMetadata(bucket, key);
    return NextResponse.json(metadata);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error getting object:", error);
    return NextResponse.json(
      { error: "Failed to get object" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    await requireAuth();

    const { path } = await params;
    if (!path || path.length < 2) {
      return NextResponse.json(
        { error: "Bucket and key are required" },
        { status: 400 }
      );
    }

    const [bucket, ...keyParts] = path;
    const key = keyParts.join("/");

    await deleteObject(bucket, key);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting object:", error);
    return NextResponse.json(
      { error: "Failed to delete object" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    await requireAuth();

    const { path } = await params;
    if (!path || path.length < 2) {
      return NextResponse.json(
        { error: "Bucket and key are required" },
        { status: 400 }
      );
    }

    const [bucket, ...keyParts] = path;
    const key = keyParts.join("/");

    const body = await request.json();
    const { action, newKey, destinationBucket, destinationKey } = body;

    switch (action) {
      case "rename":
        if (!newKey) {
          return NextResponse.json(
            { error: "New key is required" },
            { status: 400 }
          );
        }
        await renameObject(bucket, key, newKey);
        return NextResponse.json({ success: true });

      case "copy":
        if (!destinationBucket || !destinationKey) {
          return NextResponse.json(
            { error: "Destination bucket and key are required" },
            { status: 400 }
          );
        }
        await copyObject(bucket, key, destinationBucket, destinationKey);
        return NextResponse.json({ success: true });

      case "move":
        if (!destinationBucket || !destinationKey) {
          return NextResponse.json(
            { error: "Destination bucket and key are required" },
            { status: 400 }
          );
        }
        await moveObject(bucket, key, destinationBucket, destinationKey);
        return NextResponse.json({ success: true });

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
    console.error("Error updating object:", error);
    return NextResponse.json(
      { error: "Failed to update object" },
      { status: 500 }
    );
  }
}
