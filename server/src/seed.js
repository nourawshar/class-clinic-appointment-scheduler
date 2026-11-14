// server/src/seed.js
//
// Seeds the database with a default admin/coordinator user, a doctor, an
// assistant, a translator and one patient, so the API can be exercised
// without hand-crafting rows.
//
// Usage:
//   cp .env.example .env && npm run seed
//
// The .env must contain DATABASE_URL (whose database already exists) and
// SESSION_SECRET.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function seed() {
  const hash = await bcrypt.hash("secret123", 10);

  const existingAdmin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username: "admin",
        passwordHash: hash,
        firstName: "System",
        lastName: "Admin",
        role: "admin",
        isActive: true,
      },
    });
    console.log("created user: admin");
  }

  const existingCoord = await prisma.user.findUnique({ where: { username: "coordinator" } });
  if (!existingCoord) {
    await prisma.user.create({
      data: {
        username: "coordinator",
        passwordHash: hash,
        firstName: "Coord",
        lastName: "Inate",
        role: "coordinator",
        isActive: true,
      },
    });
    console.log("created user: coordinator");
  }

  const existingDoctor = await prisma.user.findUnique({ where: { username: "doctor1" } });
  if (!existingDoctor) {
    const doctor = await prisma.doctor.create({
      data: { firstName: "Dr", lastName: "A", isActive: true },
    });
    await prisma.user.create({
      data: {
        username: "doctor1",
        passwordHash: hash,
        firstName: "Dr",
        lastName: "A",
        role: "doctor",
        doctorId: doctor.id,
        isActive: true,
      },
    });
    console.log("created doctor user + doctor row:", doctor.id);
  }

  const existingAssistant = await prisma.user.findUnique({ where: { username: "assistant1" } });
  if (!existingAssistant) {
    const doctor = await prisma.doctor.create({
      data: { firstName: "Dr", lastName: "B", isActive: true },
    });
    await prisma.user.create({
      data: {
        username: "assistant1",
        passwordHash: hash,
        firstName: "Asst",
        lastName: "B",
        role: "assistant",
        doctorId: doctor.id,
        isActive: true,
      },
    });
    console.log("created assistant user + doctor row:", doctor.id);
  }

  const existingTranslator = await prisma.user.findUnique({ where: { username: "translator1" } });
  if (!existingTranslator) {
    await prisma.user.create({
      data: {
        username: "translator1",
        passwordHash: hash,
        firstName: "Trans",
        lastName: "lator",
        role: "translator",
        isActive: true,
      },
    });
    console.log("created user: translator1");
  }

  const existingPatient = await prisma.patient.findFirst({ where: { name: "SM" } });
  if (!existingPatient) {
    await prisma.patient.create({ data: { name: "SM" } });
    console.log("created patient: SM");
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
