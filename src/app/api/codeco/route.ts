import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/codeco
 * Returns list of Codeco logs.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const logs = await prisma.codecoLog.findMany({
      orderBy: { sentAt: "desc" },
    });
    return NextResponse.json(logs);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to fetch codeco logs", { status: 500 });
  }
}
