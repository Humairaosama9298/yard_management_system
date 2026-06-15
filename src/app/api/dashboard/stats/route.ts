import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const [totalStock, todayGateIn, todayGateOut, blocked, todayBookings, damage] =
      await Promise.all([
        prisma.container.count(),
        prisma.eirRecord.count({
          where: { gateDate: { gte: start, lte: end }, status: "GATE_IN" },
        }),
        prisma.eirRecord.count({
          where: { gateDate: { gte: start, lte: end }, status: "GATE_OUT" },
        }),
        prisma.blockContainer.count({ where: { isAllowed: false } }),
        prisma.loadingProgram.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
        prisma.container.count({ where: { status: "DAMAGED" } }),
      ]);

    return NextResponse.json({
      totalStock,
      todayGateIn,
      todayGateOut,
      blocked,
      todayBookings,
      damage,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}