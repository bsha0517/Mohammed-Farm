"use server";

import { prisma } from "@/lib/prisma";
import { requireFarmSession, assertCanDelete } from "@/lib/auth";
import { nextGoatTagId } from "@/lib/ids";
import { revalidatePath } from "next/cache";
import { Sex, GoatStatus, Origin } from "@prisma/client";
import { logAudit } from "@/lib/audit";

export type GoatFormInput = {
  id?: string;
  name: string;
  sex: Sex;
  breed: string;
  dob: string;
  color?: string;
  idMarks?: string;
  earTag?: string;
  status: GoatStatus;
  origin: Origin;
  motherId?: string | null;
  fatherId?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  seller?: string | null;
  sellerPhone?: string | null;
  purchaseLocation?: string | null;
  notes?: string;
};

async function validateParentage(input: GoatFormInput) {
  if (input.motherId && input.motherId === input.id) throw new Error("A goat cannot be its own mother.");
  if (input.fatherId && input.fatherId === input.id) throw new Error("A goat cannot be its own father.");

  if (input.motherId) {
    const mother = await prisma.goat.findUnique({ where: { id: input.motherId } });
    if (!mother) throw new Error("Selected mother not found.");
    if (mother.sex !== "FEMALE") throw new Error("Mother must be a female goat.");
    if (new Date(input.dob) <= new Date(mother.dob)) throw new Error("A kid's date of birth must be after its mother's date of birth.");
  }
  if (input.fatherId) {
    const father = await prisma.goat.findUnique({ where: { id: input.fatherId } });
    if (!father) throw new Error("Selected father not found.");
    if (father.sex !== "MALE") throw new Error("Father must be a male goat.");
    if (new Date(input.dob) <= new Date(father.dob)) throw new Error("A kid's date of birth must be after its father's date of birth.");
  }
}

export async function createGoat(input: GoatFormInput) {
  const { farmId } = await requireFarmSession();
  await validateParentage(input);

  const tagId = await nextGoatTagId(farmId, input.sex);

  const goat = await prisma.goat.create({
    data: {
      farmId,
      tagId,
      name: input.name,
      sex: input.sex,
      breed: input.breed || "Teddy",
      dob: new Date(input.dob),
      color: input.color || null,
      idMarks: input.idMarks || null,
      earTag: input.earTag || null,
      status: input.status,
      origin: input.origin,
      motherId: input.motherId || null,
      fatherId: input.fatherId || null,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      purchasePrice: input.purchasePrice ?? null,
      seller: input.seller || null,
      sellerPhone: input.sellerPhone || null,
      purchaseLocation: input.purchaseLocation || null,
      notes: input.notes || null,
    },
  });

  revalidatePath("/herd");
  revalidatePath("/dashboard");
  return goat;
}

export async function updateGoat(input: GoatFormInput) {
  const { farmId } = await requireFarmSession();
  if (!input.id) throw new Error("Missing goat id.");

  const existing = await prisma.goat.findFirst({ where: { id: input.id, farmId } });
  if (!existing) throw new Error("Goat not found on this farm.");

  await validateParentage(input);

  const goat = await prisma.goat.update({
    where: { id: input.id },
    data: {
      name: input.name,
      sex: input.sex,
      breed: input.breed,
      dob: new Date(input.dob),
      color: input.color || null,
      idMarks: input.idMarks || null,
      earTag: input.earTag || null,
      status: input.status,
      origin: input.origin,
      motherId: input.motherId || null,
      fatherId: input.fatherId || null,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      purchasePrice: input.purchasePrice ?? null,
      seller: input.seller || null,
      sellerPhone: input.sellerPhone || null,
      purchaseLocation: input.purchaseLocation || null,
      notes: input.notes || null,
    },
  });

  revalidatePath("/herd");
  revalidatePath(`/herd/${input.id}`);
  revalidatePath("/dashboard");
  return goat;
}

/**
 * We never hard-delete a goat (spec sections 19, 30, 43: pedigree and
 * historical records must remain intact). "Removal" is always a status
 * change. Owners can still update status; only true row deletion is
 * blocked entirely for data-integrity reasons, regardless of role.
 */
export async function retireGoat(goatId: string, newStatus: "SOLD" | "DEAD" | "CULLED") {
  const { farmId, role, userId } = await requireFarmSession();
  assertCanDelete(role); // Owner-only — terminal status changes are financial/permanent
  const goat = await prisma.goat.findFirst({ where: { id: goatId, farmId } });
  if (!goat) throw new Error("Goat not found on this farm.");

  await prisma.goat.update({ where: { id: goatId }, data: { status: newStatus as any } });
  revalidatePath("/herd");
  revalidatePath(`/herd/${goatId}`);
  await logAudit({ farmId, entityType: "Goat", entityId: goatId, action: "status_changed", fromValue: goat.status, toValue: newStatus, byUserId: userId });
}

/**
 * Permanently deletes a goat record — for correcting a genuine
 * data-entry mistake (duplicate, wrong sex/parent typed, etc.), not
 * for retiring an animal (use retireGoat / recordMortality /
 * recordCulling / recordSale for that — those preserve history on
 * purpose, per spec section 43).
 *
 * Owner-only. Refuses if the goat is any other goat's recorded parent
 * — breaking pedigree links silently is exactly the kind of data loss
 * this app is built to prevent. Everything else the goat owns
 * (photos, documents, tasks, expenses, health/vaccination/weight/
 * deworming/body-condition history, and any breeding record that
 * never led to a kidding) is deleted along with it in one transaction.
 */
export async function deleteGoatPermanently(goatId: string) {
  const { farmId, role, userId } = await requireFarmSession();
  assertCanDelete(role); // Owner only

  const goat = await prisma.goat.findFirst({
    where: { id: goatId, farmId },
    include: { motherChildren: true, fatherChildren: true, breedingAsFemale: { include: { kidding: true } }, breedingAsMale: { include: { kidding: true } } },
  });
  if (!goat) throw new Error("Goat not found on this farm.");

  if (goat.motherChildren.length > 0 || goat.fatherChildren.length > 0) {
    throw new Error(
      `Can't delete ${goat.name} — recorded as a parent of ${goat.motherChildren.length + goat.fatherChildren.length} other goat(s) in the pedigree. Change its status instead (Culled/Dead), or update those goats' parent fields first if this was a mistaken link.`
    );
  }

  const breedingWithKidding = [...goat.breedingAsFemale, ...goat.breedingAsMale].filter((b) => b.kidding);
  if (breedingWithKidding.length > 0) {
    throw new Error(`Can't delete ${goat.name} — has a breeding record with a kidding record already recorded from it. Remove that kidding record first if it was a mistake.`);
  }

  await prisma.$transaction([
    prisma.goatPhoto.deleteMany({ where: { goatId } }),
    prisma.document.deleteMany({ where: { goatId } }),
    prisma.task.deleteMany({ where: { goatId } }),
    prisma.expense.updateMany({ where: { goatId }, data: { goatId: null } }), // keep the expense, just detach it
    prisma.weightRecord.deleteMany({ where: { goatId } }),
    prisma.bodyConditionRecord.deleteMany({ where: { goatId } }),
    prisma.healthRecord.deleteMany({ where: { goatId } }),
    prisma.vaccinationRecord.deleteMany({ where: { goatId } }),
    prisma.dewormingRecord.deleteMany({ where: { goatId } }),
    prisma.medicineRecord.deleteMany({ where: { goatId } }),
    prisma.saleRecord.deleteMany({ where: { goatId } }),
    prisma.mortalityRecord.deleteMany({ where: { goatId } }),
    prisma.cullingRecord.deleteMany({ where: { goatId } }),
    prisma.breedingRecord.deleteMany({ where: { OR: [{ femaleId: goatId }, { maleId: goatId }] } }),
    prisma.goat.delete({ where: { id: goatId } }),
  ]);

  revalidatePath("/herd");
  revalidatePath("/dashboard");
  await logAudit({ farmId, entityType: "Goat", entityId: goatId, action: "deleted", fromValue: `${goat.name} (${goat.tagId})`, byUserId: userId });
}

export async function listGoats(query?: string) {
  const { farmId } = await requireFarmSession();
  const goats = await prisma.goat.findMany({
    where: { farmId },
    orderBy: { createdAt: "desc" },
  });
  if (!query) return goats;
  const q = query.toLowerCase();
  const byId = new Map(goats.map((g) => [g.id, g]));
  return goats.filter((g) => {
    const mother = g.motherId ? byId.get(g.motherId)?.name : "";
    const father = g.fatherId ? byId.get(g.fatherId)?.name : "";
    return [g.tagId, g.name, g.sex, g.status, g.breed, mother, father]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });
}

export async function getGoat(goatId: string) {
  const { farmId } = await requireFarmSession();
  return prisma.goat.findFirst({ where: { id: goatId, farmId } });
}
