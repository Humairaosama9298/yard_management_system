import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/block
 * Create a new block container entry.
 */
export async function POST(request: Request) {
  const payload = await request.json();
  const { yard, line, holdFor, containerNo, remarks } = payload;
  try {
    const [yardRec, lineRec, containerRec] = await Promise.all([
      prisma.yard.findFirst({ where: { name: yard } }),
      prisma.shippingLine.findFirst({ where: { name: line } }),
      prisma.container.findFirst({ where: { containerNo } }),
    ]);

    if (!yardRec || !lineRec || !containerRec) {
      return new NextResponse("Invalid yard, line, or container", { status: 400 });
    }

    const block = await prisma.blockContainer.create({
      data: {
        yardId: yardRec.id,
        lineId: lineRec.id,
        containerId: containerRec.id,
        containerNo,
        holdFor,
        remarks,
        isAllowed: false,
      },
    });
    return NextResponse.json(block);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to create block", { status: 500 });
  }
}

/**
 * GET /api/block
 * List all block container records.
 */
export async function GET() {
  try {
    const blocks = await prisma.blockContainer.findMany({
      include: {
        yard: true,
        line: true,
        createdByUser: true,
        amendedByUser: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(blocks);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to fetch blocks", { status: 500 });
  }
}
