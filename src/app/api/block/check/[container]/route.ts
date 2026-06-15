import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/block/check/[container]
 * Returns whether the given container number is blocked.
 */
export async function GET(request: Request, { params }: { params: { container: string } }) {
  const { container } = params;
  try {
    const block = await prisma.blockContainer.findFirst({
      where: { containerNo: container },
    });
    const result = {
      container,
      blocked: !!block && !block.isAllowed,
      reason: block?.remarks ?? null,
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to check block", { status: 500 });
  }
}
