import { PrismaClient, UserRole, EirMode, EirStatus, ContainerSize, ContainerStatus, LpType, EirCondition } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {

  // ✅ ADDED: Lines 7-17 — Clear existing data before seeding
  await prisma.blockContainer.deleteMany();
  await prisma.eirRecord.deleteMany();
  await prisma.lpSize.deleteMany();
  await prisma.loadingProgram.deleteMany();
  await prisma.container.deleteMany();
  await prisma.user.deleteMany();
  await prisma.terminal.deleteMany();
  await prisma.port.deleteMany();
  await prisma.shippingLine.deleteMany();
  await prisma.yard.deleteMany();

  // ----- Yard -----
  const yard = await prisma.yard.create({
    data: {
      name: "UOSL Depot KHI",
      code: "UOSLKHI",
      location: "Karachi",
    },
  });

  // ✅ REPLACED: Lines 18-22 — 3 lines → 20 real Karachi shipping lines
  const shippingLines = await Promise.all([
    { name: "OOCL",                       scacCode: "OOCL" },
    { name: "COSCO",                       scacCode: "COSU" },
    { name: "WCL",                         scacCode: "WCLC" },
    { name: "Maersk",                      scacCode: "MAEU" },
    { name: "MSC",                         scacCode: "MSCU" },
    { name: "CMA CGM",                     scacCode: "CMDU" },
    { name: "Hapag-Lloyd",                 scacCode: "HLCU" },
    { name: "Evergreen",                   scacCode: "EGLV" },
    { name: "Yang Ming",                   scacCode: "YMLU" },
    { name: "ONE (Ocean Network Express)", scacCode: "ONEY" },
    { name: "PIL (Pacific Int. Lines)",    scacCode: "PILU" },
    { name: "SITC",                        scacCode: "SITC" },
    { name: "Sinokor",                     scacCode: "SKLU" },
    { name: "Antong Holdings",             scacCode: "ANNU" },
    { name: "Emirates Shipping",           scacCode: "ESLU" },
    { name: "Arkas Line",                  scacCode: "ARKL" },
    { name: "Unifeeder",                   scacCode: "UFEE" },
    { name: "X-Press Feeders",             scacCode: "XPRS" },
    { name: "Safeen Feeders",              scacCode: "SFNU" },
    { name: "National Shipping (NSCSA)",   scacCode: "NSCU" },
  ].map((sl) =>
    prisma.shippingLine.create({ data: { ...sl, isActive: true } })
  ));

  // ----- Terminals ----- (unchanged)
  const terminals = await Promise.all([
    { name: "SAPT", code: "SAPT" },
    { name: "KICT", code: "KICT" },
  ].map((t) => prisma.terminal.create({ data: { ...t } })));

  // ----- Ports ----- (unchanged)
  const ports = await Promise.all([
    { name: "Karachi",    unLocode: "PKKHI", country: "PK" },
    { name: "Chittagong", unLocode: "BDCGP", country: "BD" },
  ].map((p) => prisma.port.create({ data: p })));

  // ----- User ----- (unchanged)
  const passwordHash = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@example.com",
      passwordHash,
      role: UserRole.ADMIN,
      yardId: yard.id,
    },
  });

  // ----- Containers ----- (unchanged)
  const containers = await Promise.all([
    { containerNo: "OOLU1234560", size: ContainerSize.DV20, lineId: shippingLines[0].id, yardId: yard.id },
    { containerNo: "COSU7654321", size: ContainerSize.DV40, lineId: shippingLines[1].id, yardId: yard.id },
    { containerNo: "WCLC9876543", size: ContainerSize.DV20, lineId: shippingLines[2].id, yardId: yard.id },
  ].map((c) =>
    prisma.container.create({
      data: {
        ...c,
        status: ContainerStatus.AVAILABLE,
        tareWt: 2000,
        isInYard: true,
      },
    })
  ));

  // ----- EirRecords ----- (unchanged)
  await Promise.all([
    {
      eirNo: "EIR001",
      containerId: containers[0].id,
      containerNo: containers[0].containerNo,
      mode: EirMode.IN,
      lineId: shippingLines[0].id,
      yardId: yard.id,
      terminalId: terminals[0].id,
      status: EirStatus.GATE_IN,
      gateDate: new Date(),
    },
    {
      eirNo: "EIR002",
      containerId: containers[1].id,
      containerNo: containers[1].containerNo,
      mode: EirMode.IN,
      lineId: shippingLines[1].id,
      yardId: yard.id,
      terminalId: terminals[1].id,
      status: EirStatus.GATE_IN,
      gateDate: new Date(),
    },
    {
      eirNo: "EIR003",
      containerId: containers[2].id,
      containerNo: containers[2].containerNo,
      mode: EirMode.IN,
      lineId: shippingLines[2].id,
      yardId: yard.id,
      terminalId: terminals[0].id,
      status: EirStatus.GATE_IN,
      gateDate: new Date(),
    },
  ].map((eir) =>
    prisma.eirRecord.create({ data: { ...eir, createdBy: adminUser.id } })
  ));

  // ----- Loading Programs ----- (unchanged)
  const loadingPrograms = await Promise.all([
    {
      lpNo: "LP1001",
      lpType: LpType.LOAD,
      lineId: shippingLines[0].id,
      yardId: yard.id,
      vessel: "Vessel A",
      voy: "V001",
      arrivalDate: new Date(),
      loadingPort: "Port A",
      dischargePort: "Port B",
      dischargeCode: "DCB",
      shipper: "Shipper A",
      clearingAgent: "Agent A",
    },
    {
      lpNo: "LP1002",
      lpType: LpType.LOAD,
      lineId: shippingLines[1].id,
      yardId: yard.id,
      vessel: "Vessel B",
      voy: "V002",
      arrivalDate: new Date(),
      loadingPort: "Port C",
      dischargePort: "Port D",
      dischargeCode: "DCD",
      shipper: "Shipper B",
      clearingAgent: "Agent B",
    },
  ].map((lp) =>
    prisma.loadingProgram.create({
      data: {
        ...lp,
        lpSizes: {
          create: [
            { size: ContainerSize.DV20, totalQty: 10 },
            { size: ContainerSize.DV40, totalQty: 5 },
          ],
        },
      },
    })
  ));

  // ----- BlockContainers ----- (unchanged)
  await Promise.all([
    {
      containerId: containers[0].id,
      containerNo: containers[0].containerNo,
      lineId: shippingLines[0].id,
      yardId: yard.id,
      isAllowed: false,
      holdFor: "Inspection",
    },
    {
      containerId: containers[1].id,
      containerNo: containers[1].containerNo,
      lineId: shippingLines[1].id,
      yardId: yard.id,
      isAllowed: true,
    },
  ].map((bc) =>
    prisma.blockContainer.create({ data: { ...bc, createdBy: adminUser.id } })
  ));

  console.log("🌱 Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });