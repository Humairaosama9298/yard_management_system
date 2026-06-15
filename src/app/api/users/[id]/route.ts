import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * PUT /api/users/[id]
 * Update user fields. Password will be re-hashed if provided.
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const payload = await request.json();
  const { username, email, password, role, yardId, isActive } = payload;
  try {
    const data: any = {
      username,
      email,
      role,
      yardId: yardId ?? null,
      isActive,
    };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to update user", { status: 500 });
  }
}

/**
 * DELETE /api/users/[id]
 * Deactivate (set isActive false) or reactivate user.
 * Expect query param ?activate=true to reactivate.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const url = new URL(request.url);
  const activate = url.searchParams.get("activate") === "true";
  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: activate },
    });
    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to change user status", { status: 500 });
  }
}
