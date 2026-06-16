import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/reports/daily
 * Query params: yardId, lineId, reportType, size, status, bookingNo, from, to, allYards (boolean)
 * reportType maps to EirRecord status or mode:
 *   Gate-In  -> mode = "IN"
 *   Gate-Out -> mode = "OUT"
 *   AllMovement -> no mode filter
 *   Hold -> status = "HELD"
 *   Booking -> status = "BOOKED" (placeholder)
 *   Collection -> status = "COLLECTED" (placeholder)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yardId = searchParams.get("yardId");
  const lineId = searchParams.get("lineId");
  const reportType = searchParams.get("reportType");
  const size = searchParams.get("size");
  const status = searchParams.get("status");
  const bookingNo = searchParams.get("bookingNo");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const allYards = searchParams.get("allYards") === "true";

  const where: any = {};

  if (!allYards && yardId) where.yardId = yardId;
  if (lineId) where.lineId = lineId;
  if (size) where.container = { size };
  if (status) where.status = status;
  if (bookingNo) where.bookingNo = { contains: bookingNo };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  // Map reportType to specific fields
  if (reportType) {
    switch (reportType) {
      case "Gate-In":
        where.mode = "IN";
        break;
      case "Gate-Out":
        where.mode = "OUT";
        break;
      case "Hold":
        where.status = "HELD";
        break;
      // Add other mappings as needed; default is no extra filter
    }
  }

  try {
    const records = await prisma.eirRecord.findMany({
      where,
      include: {
        container: { select: { containerNo: true, size: true } },
        line: { select: { name: true, code: true } },
        yard: { select: { name: true, code: true } },
      },
      orderBy: { gateDate: "desc" },
    });
    return NextResponse.json(records);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to fetch daily report", { status: 500 });
  }
}
