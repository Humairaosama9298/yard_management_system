// src/app/api/survey/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  const { id } = params;
  const payload = await request.json();
  const {
    yardId,
    containerId,
    containerNo,
    size,
    status,
    condition,
    photos,
  } = payload;

  try {
    const updated = await prisma.survey.update({
      where: { id },
      data: {
        ...(yardId && { yardId }),
        ...(containerId && { containerId }),
        ...(containerNo && { containerNo }),
        ...(size && { size }),
        ...(status && { status }),
        ...(condition && { condition }),
        // Replace photos if a new array is supplied
        ...(Array.isArray(photos)
          ? {
              photos: {
                deleteMany: {},
                create: photos.map((url: string) => ({
                  fileUrl: url,
                  // containerId & containerNo are required for the photo model
                  containerId: containerId ?? "",
                  containerNo: containerNo ?? "",
                  fileKey: null,
                })),
              },
            }
          : {}),
      },
      include: { photos: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update survey" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = params;
  try {
    await prisma.survey.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete survey" }, { status: 500 });
  }
}
