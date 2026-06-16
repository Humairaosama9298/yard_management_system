import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [users, employees, containers] = await Promise.all([
      (async () => {
        try {
          return await prisma.user.count();
        } catch (e) {
          console.error('Error counting users:', e);
          return 0;
        }
      })(),
      (async () => {
        try {
          // Employee model may not exist; safe fallback to 0 on error
          // @ts-ignore - prisma may not have employee model in this schema
          return await (prisma as any).employee?.count?.() ?? 0;
        } catch (e) {
          console.error('Error counting employees:', e);
          return 0;
        }
      })(),
      (async () => {
        try {
          return await prisma.container.count();
        } catch (e) {
          console.error('Error counting containers:', e);
          return 0;
        }
      })(),
    ]);

    return NextResponse.json({
      users,
      employees,
      containers,
    });
  } catch (error) {
    console.error('Stats endpoint unexpected error:', error);
    return NextResponse.json({ users: 0, employees: 0, containers: 0 }, { status: 500 });
  }
}
