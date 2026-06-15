import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const [eir, block, loading] = await Promise.all([
      prisma.eirRecord.findMany({
        orderBy: {
          gateDate: "desc",
        },
        take: 20,
        select: {
          id: true,
          eirNo: true,
          status: true,
          gateDate: true,
          containerNo: true,
        },
      }),

      prisma.blockContainer.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          containerNo: true,
          isAllowed: true,
          createdAt: true,
        },
      }),

      prisma.loadingProgram.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          lpNo: true,
          createdAt: true,
        },
      }),
    ])

    const events = [
      ...eir.map((e) => ({
        type: "EIR",
        id: e.id,
        message: `EIR ${e.eirNo} - ${e.status}`,
        timestamp: e.gateDate?.toISOString() ?? null,
      })),

      ...block.map((b) => ({
        type: "BLOCK",
        id: b.id,
        message: `Container ${b.containerNo} ${
          b.isAllowed ? "Allowed" : "Blocked"
        }`,
        timestamp: b.createdAt.toISOString(),
      })),

      ...loading.map((l) => ({
        type: "LOADING_PROGRAM",
        id: l.id,
        message: `Loading Program ${l.lpNo}`,
        timestamp: l.createdAt.toISOString(),
      })),
    ]

    const sortedEvents = events
      .filter(
        (
          event
        ): event is typeof event & {
          timestamp: string
        } => event.timestamp !== null
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      )
      .slice(0, 20)

    return NextResponse.json(sortedEvents)
  } catch (error) {
    console.error("Dashboard Activity Error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard activity",
      },
      {
        status: 500,
      }
    )
  }
}