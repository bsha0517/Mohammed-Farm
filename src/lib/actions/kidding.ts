"use server";

import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { nextGoatTagId } from "@/lib/ids";
import { revalidatePath } from "next/cache";
import { Sex } from "@prisma/client";

export type KidInput = { name?: string; sex: Sex; alive: boolean };

export type KiddingInput = {
  breedingRecordId?: string | null;
  motherId: string;
  fatherId?: string | null;
  kiddingDate: string;
  complications?: string;
  assistance?: boolean;
  vetRequired?: boolean;
  notes?: string;
  kids: KidInput[];
};

/**
 * Records a kidding event and, in the same transaction, creates a full
 * Goat profile for every kid (spec section 5) — each automatically
 * linked to the recorded mother and father in the pedigree, and given
 * the next sequential tag ID for its sex.
 */
export async function recordKidding(input: KiddingInput) {
  const { farmId } = await requireFarmSession();

  const mother = await prisma.goat.findFirst({ where: { id: input.motherId, farmId } });
  if (!mother || mother.sex !== "FEMALE") throw new Error("Mother must be a valid female goat.");

  const priorKiddings = await prisma.kiddingRecord.count({ where: { motherId: input.motherId } });

  const result = await prisma.$transaction(async (tx) => {
    const kiddingDate = new Date(input.kiddingDate);
    const kidGoats = [];

    for (const kid of input.kids) {
      const tagId = await (async () => {
        const prefix = kid.sex === "MALE" ? "TM" : "TF";
        const counter = await tx.idCounter.upsert({
          where: { farmId_prefix: { farmId, prefix } },
          update: { value: { increment: 1 } },
          create: { farmId, prefix, value: 1 },
        });
        return `${prefix}-${String(counter.value).padStart(3, "0")}`;
      })();

      const goat = await tx.goat.create({
        data: {
          farmId,
          tagId,
          name: kid.name?.trim() || tagId,
          sex: kid.sex,
          breed: mother.breed,
          dob: kiddingDate,
          status: kid.alive ? "KID" : "DEAD",
          origin: "BORN_ON_FARM",
          motherId: mother.id,
          fatherId: input.fatherId || null,
          notes: kid.alive ? null : "Stillborn / died at birth",
        },
      });
      kidGoats.push(goat);
    }

    const bornAlive = input.kids.filter((k) => k.alive).length;
    const stillborn = input.kids.filter((k) => !k.alive).length;

    const kiddingRecord = await tx.kiddingRecord.create({
      data: {
        farmId,
        breedingRecordId: input.breedingRecordId || null,
        motherId: mother.id,
        fatherId: input.fatherId || null,
        kiddingDate,
        kiddingNumber: priorKiddings + 1,
        totalBorn: input.kids.length,
        bornAlive,
        stillborn,
        maleKids: input.kids.filter((k) => k.sex === "MALE").length,
        femaleKids: input.kids.filter((k) => k.sex === "FEMALE").length,
        complications: input.complications || null,
        assistance: !!input.assistance,
        vetRequired: !!input.vetRequired,
        notes: input.notes || null,
        kidIds: kidGoats.map((g) => g.id),
      },
    });

    await tx.goat.update({ where: { id: mother.id }, data: { status: "LACTATING" } });

    if (input.breedingRecordId) {
      await tx.breedingRecord.update({
        where: { id: input.breedingRecordId },
        data: { pregStatus: "KIDDED" },
      });
    }

    return { kiddingRecord, kidGoats };
  });

  revalidatePath("/breeding");
  revalidatePath("/herd");
  revalidatePath("/dashboard");
  return result;
}

/** Reproductive performance stats for a female — spec section 6. */
export async function getFemaleReproStats(goatId: string) {
  const { farmId } = await requireFarmSession();
  const kiddings = await prisma.kiddingRecord.findMany({
    where: { farmId, motherId: goatId },
    orderBy: { kiddingDate: "desc" },
  });

  const born = kiddings.reduce((s, k) => s + k.totalBorn, 0);
  const alive = kiddings.reduce((s, k) => s + k.bornAlive, 0);
  const twins = kiddings.filter((k) => k.totalBorn === 2).length;
  const triplets = kiddings.filter((k) => k.totalBorn >= 3).length;

  let avgInterval: number | null = null;
  if (kiddings.length > 1) {
    const sorted = [...kiddings].sort((a, b) => a.kiddingDate.getTime() - b.kiddingDate.getTime());
    const gaps = sorted.slice(1).map((k, i) => (k.kiddingDate.getTime() - sorted[i].kiddingDate.getTime()) / 86400000);
    avgInterval = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  }

  return {
    totalKiddings: kiddings.length,
    totalBorn: born,
    totalAlive: alive,
    femaleKids: kiddings.reduce((s, k) => s + k.femaleKids, 0),
    maleKids: kiddings.reduce((s, k) => s + k.maleKids, 0),
    avgKidsPerKidding: kiddings.length ? born / kiddings.length : 0,
    twinRate: kiddings.length ? (twins / kiddings.length) * 100 : 0,
    tripletRate: kiddings.length ? (triplets / kiddings.length) * 100 : 0,
    survivalRate: born ? (alive / born) * 100 : 0,
    avgKiddingIntervalDays: avgInterval,
    lastKiddingDate: kiddings[0]?.kiddingDate ?? null,
  };
}

/** Breeding performance for a male — spec section 7. */
export async function getMaleBreedingStats(goatId: string) {
  const { farmId } = await requireFarmSession();
  const matings = await prisma.breedingRecord.findMany({ where: { farmId, maleId: goatId } });
  const kiddings = await prisma.kiddingRecord.findMany({ where: { farmId, fatherId: goatId } });

  const femalesCovered = new Set(matings.map((m) => m.femaleId)).size;
  const confirmedPregnant = matings.filter((m) => ["PREGNANT", "KIDDED"].includes(m.pregStatus)).length;
  const offspring = kiddings.reduce((s, k) => s + k.bornAlive, 0);

  return {
    femalesCovered,
    matingsRecorded: matings.length,
    confirmedPregnant,
    pregnancySuccessRate: matings.length ? (confirmedPregnant / matings.length) * 100 : 0,
    totalOffspring: offspring,
    maleOffspring: kiddings.reduce((s, k) => s + k.maleKids, 0),
    femaleOffspring: kiddings.reduce((s, k) => s + k.femaleKids, 0),
  };
}
