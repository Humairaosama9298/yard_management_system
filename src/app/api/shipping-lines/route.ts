import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/shipping-lines
 * Returns list of shipping lines (id and name).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const lines = await prisma.shippingLine.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(lines);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to fetch shipping lines", { status: 500 });
  }
}
