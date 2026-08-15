import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.farm.findFirst({ where: { name: "8-4L Teddy Farm" } });
  if (existing) {
    console.log("Seed data already exists — skipping. Delete the farm in Prisma Studio first if you want to reseed.");
    return;
  }

  const passwordHash = await bcrypt.hash("changeme123", 10);

  const farm = await prisma.farm.create({
    data: {
      name: "8-4L Teddy Farm",
      location: "Okara, Punjab, Pakistan",
      currency: "PKR",
      users: {
        create: {
          name: "Farm Owner",
          email: "owner@example.com",
          passwordHash,
          role: "OWNER",
        },
      },
    },
  });

  // Sultan first (no parents needed), then Noor and Heer.
  const sultan = await prisma.goat.create({
    data: {
      farmId: farm.id,
      tagId: "TM-001",
      name: "Sultan",
      sex: "MALE",
      breed: "Teddy",
      dob: new Date("2021-11-02"),
      color: "Brown",
      earTag: "T-050",
      status: "BREEDING",
      origin: "PURCHASED",
      purchaseDate: new Date("2022-01-15"),
      purchasePrice: 25000,
      seller: "Okara Livestock Market",
    },
  });

  const noor = await prisma.goat.create({
    data: {
      farmId: farm.id,
      tagId: "TF-001",
      name: "Noor",
      sex: "FEMALE",
      breed: "Teddy",
      dob: new Date("2022-03-10"),
      color: "White/Brown",
      earTag: "T-101",
      status: "BREEDING",
      origin: "BORN_ON_FARM",
    },
  });

  const heer = await prisma.goat.create({
    data: {
      farmId: farm.id,
      tagId: "TF-002",
      name: "Heer",
      sex: "FEMALE",
      breed: "Teddy",
      dob: new Date("2022-06-18"),
      color: "Black/White",
      earTag: "T-102",
      status: "BREEDING",
      origin: "BORN_ON_FARM",
    },
  });

  // Seed the ID counters so the next registered goat continues from TF-003 / TM-002.
  await prisma.idCounter.createMany({
    data: [
      { farmId: farm.id, prefix: "TF", value: 2 },
      { farmId: farm.id, prefix: "TM", value: 1 },
    ],
  });

  console.log("Seed complete.");
  console.log("Farm:", farm.name, "-", farm.location);
  console.log("Goats:", sultan.tagId, noor.tagId, heer.tagId);
  console.log("Login -> email: owner@example.com / password: changeme123");
  console.log("IMPORTANT: change this password immediately after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
