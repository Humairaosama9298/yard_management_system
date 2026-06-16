import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/master/transporters
 * Returns list of transporters.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.role) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const transporters = await prisma.transporter.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(transporters);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to fetch transporters", { status: 500 });
  }
}

/**
 * POST /api/master/transporters
 * Create a transporter. Payload: { name, ntn?, contact?, isActive? }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const payload = await request.json();
  try {
    const transporter = await prisma.transporter.create({ data: payload });
    return NextResponse.json(transporter);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to create transporter", { status: 500 });
  }
}

/**
 * PUT /api/master/transporters?id=...
 * Update a transporter.
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
    const transporter = await prisma.transporter.update({ where: { id }, data: payload });
    return NextResponse.json(transporter);
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to update transporter", { status: 500 });
  }
}

/**
 * DELETE /api/master/transporters?id=...
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
    await prisma.transporter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to delete transporter", { status: 500 });
  }
}
