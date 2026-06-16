import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

function requireAdmin(session: any) {
  const user = session?.user as { role?: string };
  return user?.role && ["ADMIN", "SUPER_ADMIN"].includes(user.role);
}

/**
 * PUT /api/users/[id]
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!requireAdmin(session)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const payload = await request.json();

    if (!payload || typeof payload !== "object") {
      return new NextResponse("Invalid request", { status: 400 });
    }

    const { username, email, password, role, yardId, isActive } = payload;

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

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to update user", { status: 500 });
  }
}

/**
 * PATCH /api/users/[id] (activate/deactivate)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!requireAdmin(session)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const activate = url.searchParams.get("activate") === "true";

  try {
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: activate },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to change user status", {
      status: 500,
    });
  }
}