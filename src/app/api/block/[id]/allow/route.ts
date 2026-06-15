import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * PUT /api/block/[id]/allow
 * Mark a block as allowed.
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  // In a real app you would pull the user from auth context – using a placeholder here
  const allowBy = "system"; // placeholder user identifier
  try {
    const updated = await prisma.blockContainer.update({
      where: { id },
      data: {
        isAllowed: true,
        allowDate: new Date(),
        allowBy,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to allow block", { status: 500 });
  }
}
