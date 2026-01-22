import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { uploadObject } from "@/lib/s3/operations";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;
  const key = formData.get("key") as string | null;

  if (!file || !bucket || !key) {
    return new Response("Missing required fields: file, bucket, key", {
      status: 400,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const totalSize = buffer.length;

        await uploadObject(
          bucket,
          key,
          buffer,
          file.type || "application/octet-stream",
          (progress) => {
            const data = JSON.stringify({
              loaded: progress.loaded,
              total: progress.total || totalSize,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          },
        );

        controller.enqueue(encoder.encode(`data: {"done":true}\n\n`));
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        controller.enqueue(
          encoder.encode(
            `data: {"error":"${errorMessage.replace(/"/g, '\\"')}"}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
