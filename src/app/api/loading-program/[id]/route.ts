import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * PUT /api/loading-program/[id]
 * Update an existing loading program (including its size rows).
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const payload = await request.json();
  const {
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
    // Update the loading program itself
    const updated = await prisma.loadingProgram.update({
      where: { id },
      data: {
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
        // Upsert size rows – delete missing, update existing, create new
        lpSizes: {
          deleteMany: {}, // delete all existing then recreate – simpler for demo
          create: lpSizes?.map((s: any) => ({
            size: s.size,
            totalQty: Number(s.totalQty),
            pickedQty: Number(s.pickedQty) || 0,
          })) ?? [],
        },
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to update loading program", { status: 500 });
  }
}

/**
 * DELETE /api/loading-program/[id]
 * Soft‑delete (cancel) a loading program.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const cancelled = await prisma.loadingProgram.update({
      where: { id },
      data: { isCancelled: true },
    });
    return NextResponse.json(cancelled);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to cancel loading program", { status: 500 });
  }
}
