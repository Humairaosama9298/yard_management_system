import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

/**
 * GET /api/users
 * Returns list of users with selected fields.
 */
export async function GET() {
  const session = await auth();
  const user = session?.user as {
    role?: string;
  };
  if (!user.role || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        yard: { select: { id: true, name: true } },
        isActive: true,
        lastLogin: true,
      },
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to fetch users", { status: 500 });
  }
}

/**
 * POST /api/users
 * Create a new user. Password is hashed with bcrypt.
 */
export async function POST(request: Request) {
  const session = await auth();

const user = session?.user as {
  role?: string;
};

if (!user.role || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
  return new NextResponse("Forbidden", { status: 403 });
}
  const payload = await request.json();
  const { username, email, password, role, yardId, isActive } = payload;
  if (!username || !email || !password || !role) {
    return new NextResponse("Missing required fields", { status: 400 });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role,
        yardId: yardId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to create user", { status: 500 });
  }
}
