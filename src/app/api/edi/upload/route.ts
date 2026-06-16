import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { RequestInit } from "node-fetch";

/**
 * POST /api/edi/upload
 * Accepts a multipart/form-data file upload, parses it (mocked), and returns a preview array.
 * Each preview row includes: id, data (any), error (optional string).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // In a real implementation we'd parse the multipart/form-data.
  // Here we mock a preview based on the file name.
  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return new NextResponse("No file uploaded", { status: 400 });
  }

  // Mock parsing: generate 5 rows, mark even rows as errors.
  const preview = Array.from({ length: 5 }, (_, i) => {
    const hasError = i % 2 === 0; // mock error on even rows
    return {
      id: i + 1,
      data: { filename: file.name, row: i + 1 },
      error: hasError ? "Invalid data in this row" : undefined,
    };
  });

  return NextResponse.json(preview);
}
