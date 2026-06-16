import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/master/yards
 * Returns list of yards.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const yards = await prisma.yard.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(yards);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to fetch yards", { status: 500 });
  }
}

/**
 * POST /api/master/yards
 * Create a new yard. Expected payload: { name, code, location?, isActive? }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const payload = await request.json();
  try {
    const yard = await prisma.yard.create({ data: payload });
    return NextResponse.json(yard);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to create yard", { status: 500 });
  }
}

/**
 * PUT /api/master/yards
 * Update an existing yard. Expected query param id and payload with fields to update.
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
    const yard = await prisma.yard.update({ where: { id }, data: payload });
    return NextResponse.json(yard);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to update yard", { status: 500 });
  }
}

/**
 * DELETE /api/master/yards
 * Delete a yard by id (query param).
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
    await prisma.yard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to delete yard", { status: 500 });
  }
}
