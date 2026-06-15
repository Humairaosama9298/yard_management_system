import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/loading-program/balance/[id]
 * Returns the remaining balance for a loading program.
 * The balance is calculated as the sum of (totalQty - pickedQty) for all sizes.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const program = await prisma.loadingProgram.findUnique({
      where: { id },
      include: { lpSizes: true },
    })
    if (!program) {
      return new NextResponse("Loading program not found", { status: 404 });
    }
    const balance = program.lpSizes.reduce((acc, size) => {
      const remaining = size.totalQty - size.pickedQty;
      return acc + (remaining > 0 ? remaining : 0);
    }, 0)
    return NextResponse.json({ id: program.id, balance })
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to fetch balance", { status: 500 });
  }
}
