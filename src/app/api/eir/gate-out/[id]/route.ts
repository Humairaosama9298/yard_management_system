import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * PUT /api/eir/gate-out/[id]
 * Amend an existing Gate‑Out record.
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const payload = await request.json();
  try {
    const updated = await prisma.eirRecord.update({
      where: { id },
      data: {
        // Allow updates to a subset of fields – preserve others
        status: payload.status,
        // other updatable fields can be added here as needed
        ...payload,
      },
    })
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to amend Gate‑Out record", { status: 500 });
  }
}

/**
 * DELETE /api/eir/gate-out/[id]
 * Cancel (soft‑delete) a Gate‑Out record.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    // Assuming a soft‑delete via a "isCancelled" flag on the EIR model – adjust if model differs
    const cancelled = await prisma.eirRecord.update({
      where: { id },
      data: { status: "CANCELLED" },
    })
    return NextResponse.json(cancelled);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to cancel Gate‑Out record", { status: 500 });
  }
}
