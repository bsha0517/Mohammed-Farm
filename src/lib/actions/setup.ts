"use server";

import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
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

/** Any signed-in user can change their own password after verifying the current one. */
export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const { userId, farmId } = await requireFarmSession();
  if (newPassword.length < 8) throw new Error("New password must be at least 8 characters.");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Account not found.");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect.");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await logAudit({ farmId, entityType: "User", entityId: userId, action: "password_changed", byUserId: userId });
}

/** Owners can invite farm workers or a veterinarian — spec section 29 roles. */
export async function inviteTeamMember(input: { farmId: string; name: string; email: string; password: string; role: "WORKER" | "VET" }) {
  const { farmId, role, userId } = await requireFarmSession();
  if (role !== "OWNER") throw new Error("Only farm owners can add team members.");
  if (input.farmId !== farmId) throw new Error("Farm mismatch.");

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("An account with this email already exists.");
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { farmId, name: input.name, email: input.email, passwordHash, role: input.role },
  });
  await logAudit({ farmId, entityType: "User", entityId: user.id, action: "invited", toValue: `${input.name} (${input.role})`, byUserId: userId });
  return user;
}

/**
 * Removes a team member's account. Owner-only. Refuses to remove your own
 * account (avoid accidental self-lockout) or the farm's last remaining
 * Owner (a farm must always have at least one admin).
 */
export async function removeTeamMember(targetUserId: string) {
  const { farmId, userId, role } = await requireFarmSession();
  if (role !== "OWNER") throw new Error("Only farm owners can remove team members.");
  if (targetUserId === userId) throw new Error("You can't remove your own account while signed in as it.");

  const target = await prisma.user.findFirst({ where: { id: targetUserId, farmId } });
  if (!target) throw new Error("User not found on this farm.");

  if (target.role === "OWNER") {
    const ownerCount = await prisma.user.count({ where: { farmId, role: "OWNER" } });
    if (ownerCount <= 1) throw new Error("Can't remove the only owner — invite another owner first, or keep this account.");
  }

  await prisma.user.delete({ where: { id: targetUserId } });
  await logAudit({ farmId, entityType: "User", entityId: targetUserId, action: "removed", fromValue: `${target.name} (${target.role})`, byUserId: userId });
}
