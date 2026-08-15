import { prisma } from "./prisma";
import { Sex } from "@prisma/client";

/**
 * Generates the next sequential display ID for a goat, scoped per farm
 * and per sex: TF-001, TF-002... for females, TM-001, TM-002... for males.
 * Uses an atomic increment so concurrent registrations never collide.
 */
export async function nextGoatTagId(farmId: string, sex: Sex): Promise<string> {
  const prefix = sex === "MALE" ? "TM" : "TF";

  const counter = await prisma.idCounter.upsert({
    where: { farmId_prefix: { farmId, prefix } },
    update: { value: { increment: 1 } },
    create: { farmId, prefix, value: 1 },
  });

  return `${prefix}-${String(counter.value).padStart(3, "0")}`;
}
