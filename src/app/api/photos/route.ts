// src/app/api/photos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const containerId = searchParams.get("container"); // containerId expected
  const from = searchParams.get("from");
  const to = searchParams.get("to");

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
      include: { survey: { select: { id: true, containerNo: true } } },
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json(photos);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}
