import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/master/ports
 * List all ports.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.role) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const ports = await prisma.port.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(ports);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to fetch ports", { status: 500 });
  }
}

/**
 * POST /api/master/ports
 * Create a port. Payload: { name, unLocode, country?, isActive? }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const payload = await request.json();
  try {
    const port = await prisma.port.create({ data: payload });
    return NextResponse.json(port);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to create port", { status: 500 });
  }
}

/**
 * PUT /api/master/ports?id=...
 * Update a port.
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
    const port = await prisma.port.update({ where: { id }, data: payload });
    return NextResponse.json(port);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to update port", { status: 500 });
  }
}

/**
 * DELETE /api/master/ports?id=...
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
    await prisma.port.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to delete port", { status: 500 });
  }
}
