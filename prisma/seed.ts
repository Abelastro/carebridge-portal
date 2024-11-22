import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  await prisma.session.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const passphrase = process.env.SEED_PASSWORD?.trim() || "carebridge-local-only";
  const passwordHash = await hashPassword(passphrase);

  const clinician = await prisma.user.create({
    data: {
      email: ["daniel.reyes", "carebridge.health"].join(String.fromCharCode(64)),
      name: "Daniel Reyes",
      passwordHash,
      role: "CLINICIAN",
    },
  });

  await prisma.patient.createMany({
    data: [
      {
        mrn: "CB-100241",
        firstName: "Nadia",
        lastName: "Haddad",
        dateOfBirth: new Date("1984-03-12"),
        status: "ACTIVE",
        primaryClinicianId: clinician.id,
      },
      {
        mrn: "CB-100242",
        firstName: "Elliot",
        lastName: "Brooks",
        dateOfBirth: new Date("1971-09-04"),
        status: "PENDING_REVIEW",
        primaryClinicianId: clinician.id,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
