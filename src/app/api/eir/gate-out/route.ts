import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/eir/gate-out
 * Create a new Gate‑Out EIR record.
 */
export async function POST(request: Request) {
  const payload = await request.json();
  try {
    const record = await prisma.eirRecord.create({
      data: {
        // Map only the fields we expect – extra fields are ignored by Prisma if not in the model
        eirNo: payload.eirNo,
        yard: payload.yard,
        terminal: payload.terminal,
        line: payload.line,
        containerNo: payload.containerNo,
        size: payload.size,
        status: payload.status,
        tareWt: payload.tareWt,
        heavy: payload.heavy ?? false,
        blNumber: payload.blNumber,
        vessel: payload.vessel,
        voyage: payload.voyage,
        arrivalDate: payload.arrivalDate ? new Date(payload.arrivalDate) : undefined,
        consignee: payload.consignee,
        clearingAgent: payload.clearingAgent,
        transporter: payload.transporter,
        truckNo: payload.truckNo,
        exchangeRate: payload.exchangeRate,
        discount: payload.discount,
        condition: payload.condition,
        prevCondition: payload.prevCondition,
        pnr: payload.pnr ?? false,
        sendCodeco: payload.sendCodeco ?? false,
        bypassSurvey: payload.bypassSurvey ?? false,
        // Gate‑Out specific fields
        lpNo: payload.lpNo,
        dischargePort: payload.dischargePort,
        dischargeCode: payload.dischargeCode,
        destination: payload.destination,
        shipper: payload.shipper,
        reUpdateExchange: payload.reUpdateExchange ?? false,
      },
    })
    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to create Gate‑Out record", { status: 500 });
  }
}

/**
 * GET /api/eir/gate-out
 * Return a list of Gate‑Out records (basic view).
 */
export async function GET() {
  try {
    const records = await prisma.eirRecord.findMany({
      where: { status: "GATE_OUT" },
      select: {
        id: true,
        eirNo: true,
        containerNo: true,
        size: true,
        status: true,
        lpNo: true,
        dischargePort: true,
        destination: true,
        createdAt: true,
      },
    })
    return NextResponse.json(records);
  } catch (err) {
    console.error(err);
    return new NextResponse("Failed to fetch Gate‑Out records", { status: 500 });
  }
}
