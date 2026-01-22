import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { listBuckets } from "@/lib/s3/operations";

export async function GET() {
  try {
    await requireAuth();
    const buckets = await listBuckets();
    return NextResponse.json({ buckets });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing buckets:", error);
    return NextResponse.json(
      { error: "Failed to list buckets" },
      { status: 500 },
    );
  }
}
