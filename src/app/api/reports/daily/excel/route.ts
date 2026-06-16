import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";

/**
 * GET /api/reports/daily/excel
 * Returns an XLSX file generated from the same query as the JSON endpoint.
 * Accepts identical query parameters.
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
      // other mappings can be added as needed
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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Daily Report");

    // Header row
    sheet.addRow([
      "Gate Date",
      "Mode",
      "Status",
      "Container No",
      "Size",
      "Line",
      "Yard",
    ]);

    // Data rows
    records.forEach((r) => {
      sheet.addRow([
        r.gateDate ? r.gateDate.toISOString().split("T")[0] : "",
        r.mode ?? "",
        r.status ?? "",
        r.container?.containerNo ?? "",
        r.container?.size ?? "",
        r.line?.name ?? "",
        r.yard?.name ?? "",
      ]);
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const response = new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="daily_report.xlsx"`,
      },
      status: 200,
    });
    return response;
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to generate Excel report", { status: 500 });
  }
}
