import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/loading-program
 * Create a new loading program with its size rows.
 */
export async function POST(request: Request) {
  const payload = await request.json();
  const {
    lpNo,
    lpType,
    lineId,
    terminalId,
    yardId,
    vessel,
    voy,
    arrivalDate,
    loadingPort,
    loadingCode,
    dischargePort,
    dischargeCode,
    finalDest,
    finalCode,
    shipper,
    clearingAgent,
    transporter,
    chalanNo,
    isCancelled,
    lpSizes,
  } = payload;

  try {
    const program = await prisma.loadingProgram.create({
      data: {
        lpNo,
        lpType,
        lineId,
        terminalId,
        yardId,
        vessel,
        voy,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : undefined,
        loadingPort,
        loadingCode,
        dischargePort,
        dischargeCode,
        finalDest,
        finalCode,
        shipper,
        clearingAgent,
        transporter,
        chalanNo,
        isCancelled: !!isCancelled,
        lpSizes: {
          create: lpSizes?.map((s: any) => ({
            size: s.size,
            totalQty: Number(s.totalQty),
            pickedQty: 0,
          })) ?? [],
        },
      },
    });
    return NextResponse.json(program);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to create loading program", { status: 500 });
  }
}

/**
 * GET /api/loading-program
 * Return all loading programs (basic info, include sizes).
 */
export async function GET() {
  try {
    const programs = await prisma.loadingProgram.findMany({
      include: { lpSizes: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(programs);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to fetch loading programs", { status: 500 });
  }
}
