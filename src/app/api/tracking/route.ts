import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Expected query parameters:
//   type: "container" | "booking" | "truck" | "eir"
//   q: search string
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || "eir").toLowerCase();
  const q = (searchParams.get("q") || "").trim();

  // Basic defensive check – if no query, return empty list
  if (!q) {
    return NextResponse.json([]);
  }

  // Build where clause based on type
  let whereClause: any = {};
  switch (type) {
    case "container":
      whereClause = { container: { contains: q, mode: "insensitive" } };
      break;
    case "booking":
      whereClause = { bookingNo: { contains: q, mode: "insensitive" } };
      break;
    case "truck":
      // Assuming a "truck" field exists; fallback to container if not
      whereClause = { truck: { contains: q, mode: "insensitive" } };
      break;
    case "eir":
    default:
      whereClause = { eirNo: { contains: q, mode: "insensitive" } };
  }

  try {
    const records = await prisma.eirRecord.findMany({
      where: whereClause,
      select: {
        id: true,
        eirNo: true,
        mode: true,
        container: true,
        size: true,
        line: true,
        hold: true,
        gateDate: true,
        bookingNo: true,
        tare: true,
        depot: true,
        status: true,
        remarks: true,
        terminal: true,
      },
      orderBy: { gateDate: "desc" },
      take: 20,
    });

    // Normalise field names to match the front‑end expectations
    const data = records.map((r) => ({
      id: r.id,
      eirNo: r.eirNo,
      mode: r.mode,
      container: r.container,
      size: r.size,
      line: r.line,
      hold: r.hold,
      date: r.gateDate?.toISOString() ?? null,
      bookingNo: r.bookingNo,
      tare: r.tare,
      depot: r.depot,
      status: r.status,
      remarks: r.remarks,
      terminal: r.terminal,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("Tracking API error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
