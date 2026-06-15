// src/app/api/photos/zip/route.ts
// Zip download endpoint for container photos.
// Accepts query parameters:
//   container – containerId (optional)
//   from – ISO date string (optional, start of range)
//   to – ISO date string (optional, end of range)
// Returns a ZIP file containing the matching photos.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const containerId = searchParams.get("container");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Build Prisma filter
  const where: any = {};
  if (containerId) where.containerId = containerId;
  if (from || to) {
    where.uploadedAt = {};
    if (from) where.uploadedAt.gte = new Date(from);
    if (to) where.uploadedAt.lte = new Date(to);
  }

  try {
    const photos = await prisma.containerPhoto.findMany({
      where,
      select: { id: true, fileUrl: true },
      orderBy: { uploadedAt: "desc" },
    });

    if (photos.length === 0) {
      return NextResponse.json({ error: "No photos found" }, { status: 404 });
    }

    // Dynamically import jszip to avoid load‑time errors if the package is missing.
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    // Fetch each photo and add to the zip archive.
    for (const photo of photos) {
      try {
        const resp = await fetch(photo.fileUrl);
        if (!resp.ok) continue; // skip unavailable files
        const buffer = await resp.arrayBuffer();
        // Preserve original extension if possible; fallback to .jpg
        const extMatch = photo.fileUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/);
        const ext = extMatch?.[1] ?? "jpg";
        zip.file(`${photo.id}.${ext}`, buffer);
      } catch {
        // ignore individual fetch errors
      }
    }

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    return new NextResponse(zipContent, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=photos.zip",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate ZIP" }, { status: 500 });
  }
}
