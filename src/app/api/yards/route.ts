import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/yards
 * Returns list of yards (id and name).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const yards = await prisma.yard.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(yards);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to fetch yards", { status: 500 });
  }
}
