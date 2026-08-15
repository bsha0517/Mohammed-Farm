"use server";

import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { checkInbreeding } from "@/lib/pedigree";
import { addDays } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { MatingMethod, PregnancyStatus } from "@prisma/client";

export type BreedingInput = {
  femaleId: string;
  maleId: string;
  heatDate?: string | null;
  matingDate: string;
  attempts?: number;
  method: MatingMethod;
  expectedKidding?: string | null;
  notes?: string;
  /** Set true once the user has seen and accepted an inbreeding warning. */
  overrideWarning?: boolean;
};

/**
 * Call this from the client BEFORE submitting the form, to show the
 * red warning banner described in spec section 3.
 */
export async function previewInbreedingWarning(maleId: string, femaleId: string) {
  await requireFarmSession();
  if (!maleId || !femaleId) return null;
  return checkInbreeding(maleId, femaleId);
}

export async function createBreedingRecord(input: BreedingInput) {
  const { farmId } = await requireFarmSession();

  const [female, male] = await Promise.all([
    prisma.goat.findFirst({ where: { id: input.femaleId, farmId } }),
    prisma.goat.findFirst({ where: { id: input.maleId, farmId } }),
  ]);
  if (!female || female.sex !== "FEMALE") throw new Error("A female cannot be recorded as mating with another female — select a valid female.");
  if (!male || male.sex !== "MALE") throw new Error("A male cannot become pregnant — select a valid male for the sire.");
  if (["DEAD", "SOLD"].includes(female.status) || ["DEAD", "SOLD"].includes(male.status)) {
    throw new Error("Dead or sold animals cannot be recorded as active breeding animals.");
  }

  const warning = await checkInbreeding(input.maleId, input.femaleId);
  if (warning && !input.overrideWarning) {
    // Return the warning instead of throwing, so the UI can show it and
    // ask for explicit confirmation before resubmitting with override=true.
    return { warning };
  }

  const expectedKidding = input.expectedKidding
    ? new Date(input.expectedKidding)
    : addDays(input.matingDate, 150);

  const record = await prisma.breedingRecord.create({
    data: {
      farmId,
      femaleId: input.femaleId,
      maleId: input.maleId,
      heatDate: input.heatDate ? new Date(input.heatDate) : null,
      matingDate: new Date(input.matingDate),
      attempts: input.attempts || 1,
      method: input.method,
      expectedKidding,
      pregStatus: "MATED",
      notes: input.notes || null,
      statusHistory: [{ status: "MATED", date: new Date().toISOString() }],
    },
  });

  await prisma.goat.update({ where: { id: female.id }, data: { status: "BREEDING" } });

  revalidatePath("/breeding");
  revalidatePath("/dashboard");
  return { record };
}

export async function updatePregnancyStatus(
  breedingId: string,
  pregStatus: PregnancyStatus,
  extra?: { pregConfirmedDate?: string; pregConfirmMethod?: string; expectedKidding?: string }
) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.breedingRecord.findFirst({ where: { id: breedingId, farmId } });
  if (!rec) throw new Error("Breeding record not found on this farm.");

  const history = Array.isArray(rec.statusHistory) ? (rec.statusHistory as any[]) : [];
  history.push({ status: pregStatus, date: new Date().toISOString() });

  const updated = await prisma.breedingRecord.update({
    where: { id: breedingId },
    data: {
      pregStatus,
      pregConfirmedDate: extra?.pregConfirmedDate ? new Date(extra.pregConfirmedDate) : rec.pregConfirmedDate,
      pregConfirmMethod: extra?.pregConfirmMethod ?? rec.pregConfirmMethod,
      expectedKidding: extra?.expectedKidding ? new Date(extra.expectedKidding) : rec.expectedKidding,
      statusHistory: history,
    },
  });

  // Keep the goat's herd status roughly in sync with pregnancy status.
  const goatStatus =
    pregStatus === "PREGNANT" ? "PREGNANT" : pregStatus === "KIDDED" ? "LACTATING" : pregStatus === "NOT_PREGNANT" || pregStatus === "ABORTED" ? "BREEDING" : undefined;
  if (goatStatus) {
    await prisma.goat.update({ where: { id: rec.femaleId }, data: { status: goatStatus as any } });
  }

  revalidatePath("/breeding");
  revalidatePath("/dashboard");
  return updated;
}

export async function listBreedingRecords() {
  const { farmId } = await requireFarmSession();
  return prisma.breedingRecord.findMany({
    where: { farmId },
    include: { female: true, male: true, kidding: true },
    orderBy: { matingDate: "desc" },
  });
}
