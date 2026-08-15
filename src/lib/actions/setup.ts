"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Creates a new farm plus its first Owner/Admin account. This is what
 * powers the one-time /setup page — see README "How to create the
 * first admin account".
 */
export async function createFarmAndOwner(input: {
  farmName: string;
  location?: string;
  currency?: string;
  ownerName: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("An account with this email already exists.");
  if (input.password.length < 8) throw new Error("Password must be at least 8 characters.");

  const passwordHash = await bcrypt.hash(input.password, 10);

  const farm = await prisma.farm.create({
    data: {
      name: input.farmName,
      location: input.location || null,
      currency: input.currency || "PKR",
      users: {
        create: {
          name: input.ownerName,
          email: input.email,
          passwordHash,
          role: "OWNER",
        },
      },
    },
  });

  return farm;
}

/** Owners can invite farm workers or a veterinarian — spec section 29 roles. */
export async function inviteTeamMember(input: { farmId: string; name: string; email: string; password: string; role: "WORKER" | "VET" }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("An account with this email already exists.");
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: { farmId: input.farmId, name: input.name, email: input.email, passwordHash, role: input.role },
  });
}
