// src/app/api/reports/stock/route.ts
// Stock report API
// Supports JSON response (default) and Excel download via ?format=excel

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";

type StockRecord = {
  size: string;
  opening: { heavy: number; med: number; total: number; dmg: number };
  received: { heavy: number; med: number; total: number; dmg: number };
  delivered: { heavy: number; med: number; total: number; dmg: number };
  closing: { heavy: number; med: number; total: number; dmg: number };
};

// Placeholder aggregation – in a real system this would compute based on container movements
function buildPlaceholder(): StockRecord[] {
  return [
    {
      size: "DV20",
      opening: { heavy: 10, med: 5, total: 15, dmg: 1 },
      received: { heavy: 3, med: 2, total: 5, dmg: 0 },
      delivered: { heavy: 4, med: 1, total: 5, dmg: 0 },
      closing: { heavy: 9, med: 6, total: 15, dmg: 1 },
    },
    {
      size: "DV40",
      opening: { heavy: 8, med: 4, total: 12, dmg: 0 },
      received: { heavy: 2, med: 1, total: 3, dmg: 0 },
      delivered: { heavy: 3, med: 2, total: 5, dmg: 0 },
      closing: { heavy: 7, med: 3, total: 10, dmg: 0 },
    },
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  // Filters (location, line, date range, allYards) – not used in placeholder data
  // In production, translate these into Prisma where clauses.

  const data = buildPlaceholder();

  if (format === "excel") {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Stock Report");
    // Header rows
    ws.addRow(["Size", "Opening Heavy", "Opening Med", "Opening Total", "Opening Dmg", "Received Heavy", "Received Med", "Received Total", "Received Dmg", "Delivered Heavy", "Delivered Med", "Delivered Total", "Delivered Dmg", "Closing Heavy", "Closing Med", "Closing Total", "Closing Dmg"]);
    data.forEach((r) => {
      ws.addRow([
        r.size,
        r.opening.heavy,
        r.opening.med,
        r.opening.total,
        r.opening.dmg,
        r.received.heavy,
        r.received.med,
        r.received.total,
        r.received.dmg,
        r.delivered.heavy,
        r.delivered.med,
        r.delivered.total,
        r.delivered.dmg,
        r.closing.heavy,
        r.closing.med,
        r.closing.total,
        r.closing.dmg,
      ]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=stock_report.xlsx",
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(data);
}
