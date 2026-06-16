import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * POST /api/edi/confirm
 * Accepts an array of parsed rows (as returned by /api/edi/upload) and persists them.
 * For simplicity we just log them and return a summary.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const rows = await request.json();
  // In a real app, you'd map rows to actual DB models. Here we just count.
  let created = 0,
    updated = 0,
    failed = 0;
  for (const row of rows) {
    if (row.error) {
      failed++;
    } else {
      // Mock: treat even ids as updates, odd as creates
      if (row.id % 2 === 0) updated++;
      else created++;
    }
  }

  return NextResponse.json({ created, updated, failed });
}
