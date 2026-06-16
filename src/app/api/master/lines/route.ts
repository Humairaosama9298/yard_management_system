import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/master/lines
 * Returns list of shipping lines.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.role) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const lines = await prisma.shippingLine.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(lines);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to fetch shipping lines", { status: 500 });
  }
}

/**
 * POST /api/master/lines
 * Create a new shipping line. Payload: { name, scacCode, isActive? }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const payload = await request.json();
  try {
    const line = await prisma.shippingLine.create({ data: payload });
    return NextResponse.json(line);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to create shipping line", { status: 500 });
  }
}

/**
 * PUT /api/master/lines?id=...   (query param)
 * Update an existing shipping line.
 */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });
  const payload = await request.json();
  try {
    const line = await prisma.shippingLine.update({ where: { id }, data: payload });
    return NextResponse.json(line);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to update shipping line", { status: 500 });
  }
}

/**
 * DELETE /api/master/lines?id=...
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });
  try {
    await prisma.shippingLine.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to delete shipping line", { status: 500 });
  }
}
