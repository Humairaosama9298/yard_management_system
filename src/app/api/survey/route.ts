import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all surveys
export async function GET() {
  const surveys = await prisma.survey.findMany({
    include: { photos: true },
    orderBy: { surveyedAt: "desc" },
  });
  return NextResponse.json(surveys);
}

// POST create a new survey
export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Expected fields: containerId, containerNo, yardId, size, status, condition, photos (array of URLs)
    const { containerId, containerNo, yardId, size, status, condition, photos = [] } = data;
    if (!containerId || !yardId) {
      return NextResponse.json({ error: "containerId and yardId are required" }, { status: 400 });
    }
    const survey = await prisma.survey.create({
      data: {
        containerId,
        containerNo: containerNo ?? "",
        yardId,
        size,
        status,
        condition,
        surveyedAt: new Date(),
        photos: {
          create: photos.map((url: string) => ({
            fileUrl: url,
            // These fields are required by the model; we reuse container info.
            containerId,
            containerNo: containerNo ?? "",
            fileKey: null,
          })),
        },
      },
      include: { photos: true },
    });
    return NextResponse.json(survey);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create survey" }, { status: 500 });
  }
}
