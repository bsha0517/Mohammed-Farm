"use server";

import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/* ---------------- Health ---------------- */

export async function addHealthRecord(input: {
  goatId: string;
  date: string;
  symptoms?: string;
  diagnosis?: string;
  temperature?: string;
  veterinarian?: string;
  treatment?: string;
  medicine?: string;
  dose?: string;
  duration?: string;
  cost?: number;
  recoveryDate?: string;
  notes?: string;
}) {
  const { farmId } = await requireFarmSession();
  const goat = await prisma.goat.findFirst({ where: { id: input.goatId, farmId } });
  if (!goat) throw new Error("Goat not found on this farm.");

  const rec = await prisma.healthRecord.create({
    data: {
      farmId,
      goatId: input.goatId,
      date: new Date(input.date),
      symptoms: input.symptoms || null,
      diagnosis: input.diagnosis || null,
      temperature: input.temperature || null,
      veterinarian: input.veterinarian || null,
      treatment: input.treatment || null,
      medicine: input.medicine || null,
      dose: input.dose || null,
      duration: input.duration || null,
      cost: input.cost || 0,
      recoveryDate: input.recoveryDate ? new Date(input.recoveryDate) : null,
      notes: input.notes || null,
    },
  });
  revalidatePath(`/herd/${input.goatId}`);
  revalidatePath("/health");
  return rec;
}

/* ---------------- Vaccination ---------------- */

export async function addVaccination(input: {
  goatId: string;
  vaccine: string;
  date: string;
  dose?: string;
  batchNumber?: string;
  administeredBy?: string;
  nextDue?: string;
  notes?: string;
}) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.vaccinationRecord.create({
    data: {
      farmId,
      goatId: input.goatId,
      vaccine: input.vaccine,
      date: new Date(input.date),
      dose: input.dose || null,
      batchNumber: input.batchNumber || null,
      administeredBy: input.administeredBy || null,
      nextDue: input.nextDue ? new Date(input.nextDue) : null,
      notes: input.notes || null,
    },
  });
  revalidatePath(`/herd/${input.goatId}`);
  revalidatePath("/health");
  revalidatePath("/dashboard");
  return rec;
}

/** Bulk vaccination — spec section 9: select many goats, one vaccine, creates one record per goat. */
export async function bulkVaccinate(input: {
  goatIds: string[];
  vaccine: string;
  date: string;
  dose?: string;
  batchNumber?: string;
  administeredBy?: string;
  nextDue?: string;
}) {
  const { farmId } = await requireFarmSession();
  if (input.goatIds.length === 0) throw new Error("Select at least one goat.");

  const owned = await prisma.goat.findMany({ where: { farmId, id: { in: input.goatIds } }, select: { id: true } });
  if (owned.length !== input.goatIds.length) throw new Error("Some selected goats do not belong to this farm.");

  await prisma.vaccinationRecord.createMany({
    data: input.goatIds.map((goatId) => ({
      farmId,
      goatId,
      vaccine: input.vaccine,
      date: new Date(input.date),
      dose: input.dose || null,
      batchNumber: input.batchNumber || null,
      administeredBy: input.administeredBy || null,
      nextDue: input.nextDue ? new Date(input.nextDue) : null,
    })),
  });

  revalidatePath("/health");
  revalidatePath("/dashboard");
}

/* ---------------- Deworming ---------------- */

export async function addDeworming(input: {
  goatId: string;
  date: string;
  dewormer: string;
  activeIngredient?: string;
  dose?: string;
  weightAtTreatment?: number;
  reason?: string;
  nextReview?: string;
  notes?: string;
}) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.dewormingRecord.create({
    data: {
      farmId,
      goatId: input.goatId,
      date: new Date(input.date),
      dewormer: input.dewormer,
      activeIngredient: input.activeIngredient || null,
      dose: input.dose || null,
      weightAtTreatment: input.weightAtTreatment ?? null,
      reason: input.reason || null,
      nextReview: input.nextReview ? new Date(input.nextReview) : null,
      notes: input.notes || null,
    },
  });
  revalidatePath(`/herd/${input.goatId}`);
  return rec;
}

/* ---------------- Weight & body condition ---------------- */

export async function addWeightRecord(input: { goatId: string; date: string; weightKg: number; notes?: string }) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.weightRecord.create({
    data: { farmId, goatId: input.goatId, date: new Date(input.date), weightKg: input.weightKg, notes: input.notes || null },
  });
  revalidatePath(`/herd/${input.goatId}`);
  return rec;
}

export async function addBodyConditionRecord(input: { goatId: string; date: string; score: number; notes?: string }) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.bodyConditionRecord.create({
    data: { farmId, goatId: input.goatId, date: new Date(input.date), score: input.score, notes: input.notes || null },
  });
  revalidatePath(`/herd/${input.goatId}`);
  return rec;
}

/** Growth stats for a goat profile — spec section 11. */
export async function getWeightHistory(goatId: string) {
  const { farmId } = await requireFarmSession();
  const records = await prisma.weightRecord.findMany({ where: { farmId, goatId }, orderBy: { date: "asc" } });
  if (records.length < 2) return { records, totalGainKg: null, avgDailyGainKg: null };

  const first = records[0];
  const last = records[records.length - 1];
  const days = (last.date.getTime() - first.date.getTime()) / 86400000;
  const totalGainKg = last.weightKg - first.weightKg;

  return { records, totalGainKg, avgDailyGainKg: days > 0 ? totalGainKg / days : null };
}
