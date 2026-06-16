import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/master/terminals
 * List all terminals.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.role) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const terminals = await prisma.terminal.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(terminals);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to fetch terminals", { status: 500 });
  }
}

/**
 * POST /api/master/terminals
 * Create a terminal. Payload: { name, code, location?, isActive? }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const payload = await request.json();
  try {
    const terminal = await prisma.terminal.create({ data: payload });
    return NextResponse.json(terminal);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to create terminal", { status: 500 });
  }
}

/**
 * PUT /api/master/terminals?id=...
 * Update a terminal.
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
    const terminal = await prisma.terminal.update({ where: { id }, data: payload });
    return NextResponse.json(terminal);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to update terminal", { status: 500 });
  }
}

/**
 * DELETE /api/master/terminals?id=...
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
    await prisma.terminal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to delete terminal", { status: 500 });
  }
}
