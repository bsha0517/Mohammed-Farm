"use server";

import { prisma } from "@/lib/prisma";
import { requireFarmSession, assertCanDelete } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SalePurpose } from "@prisma/client";

/* ---------------- Expenses / income ---------------- */

export async function addExpense(input: {
  date: string;
  category: string;
  description?: string;
  amount: number;
  paymentMethod?: string;
  goatId?: string | null;
}) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.expense.create({
    data: {
      farmId,
      date: new Date(input.date),
      category: input.category,
      description: input.description || null,
      amount: input.amount,
      paymentMethod: input.paymentMethod || "Cash",
      goatId: input.goatId || null,
    },
  });
  revalidatePath("/finance");
  return rec;
}

export async function addIncome(input: { date: string; source: string; description?: string; amount: number }) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.income.create({
    data: { farmId, date: new Date(input.date), source: input.source, description: input.description || null, amount: input.amount },
  });
  revalidatePath("/finance");
  return rec;
}

/* ---------------- Sales ---------------- */

export async function recordSale(input: {
  goatId: string;
  buyer: string;
  buyerPhone?: string;
  saleDate: string;
  price: number;
  weightKg?: number;
  purpose: SalePurpose;
}) {
  const { farmId, role } = await requireFarmSession();
  assertCanDelete(role); // selling is a terminal/financial action — Owner only
  const goat = await prisma.goat.findFirst({ where: { id: input.goatId, farmId } });
  if (!goat) throw new Error("Goat not found on this farm.");
  if (["DEAD", "SOLD"].includes(goat.status)) throw new Error("This goat is already marked dead or sold.");
  const [sale] = await prisma.$transaction([
    prisma.saleRecord.create({
      data: {
        farmId,
        goatId: input.goatId,
        buyer: input.buyer,
        buyerPhone: input.buyerPhone || null,
        saleDate: new Date(input.saleDate),
        price: input.price,
        weightKg: input.weightKg ?? null,
        purpose: input.purpose,
      },
    }),
    prisma.goat.update({ where: { id: input.goatId }, data: { status: "SOLD" } }),
  ]);

  revalidatePath("/finance");
  revalidatePath("/herd");
  revalidatePath("/dashboard");
  return sale;
}

/** Transparent, non-exact profitability estimate for one goat — spec section 17. */
export async function getGoatProfitability(goatId: string) {
  const { farmId } = await requireFarmSession();
  const goat = await prisma.goat.findFirst({ where: { id: goatId, farmId } });
  if (!goat) throw new Error("Goat not found.");

  const [healthCost, expenseCost, sale, kiddings] = await Promise.all([
    prisma.healthRecord.aggregate({ where: { goatId }, _sum: { cost: true } }),
    prisma.expense.aggregate({ where: { goatId }, _sum: { amount: true } }),
    prisma.saleRecord.findUnique({ where: { goatId } }),
    prisma.kiddingRecord.findMany({ where: { motherId: goatId } }),
  ]);

  const kidIds = kiddings.flatMap((k) => k.kidIds);
  const kidSales = kidIds.length
    ? await prisma.saleRecord.aggregate({ where: { goatId: { in: kidIds } }, _sum: { price: true } })
    : { _sum: { price: 0 } };

  const purchasePrice = goat.purchasePrice || 0;
  const healthExpenses = healthCost._sum.cost || 0;
  const otherExpenses = expenseCost._sum.amount || 0;
  const ownSaleValue = sale?.price || 0;
  const kidsSoldRevenue = kidSales._sum.price || 0;

  const estimatedContribution = ownSaleValue + kidsSoldRevenue - purchasePrice - healthExpenses - otherExpenses;

  return {
    purchasePrice,
    healthExpenses,
    otherExpenses,
    kidsProduced: kiddings.reduce((s, k) => s + k.bornAlive, 0),
    kidsSoldRevenue,
    ownSaleValue,
    estimatedContribution,
    note: "This is an estimate for guidance only, not exact accounting. Feed cost is not itemized per animal in the MVP.",
  };
}

/* ---------------- Mortality / culling ---------------- */

export async function recordMortality(input: { goatId: string; dateOfDeath: string; ageAtDeath?: string; suspectedCause?: string; confirmedCause?: string; vetDiagnosis?: string; notes?: string }) {
  const { farmId, role } = await requireFarmSession();
  assertCanDelete(role);
  const [rec] = await prisma.$transaction([
    prisma.mortalityRecord.create({
      data: {
        farmId,
        goatId: input.goatId,
        dateOfDeath: new Date(input.dateOfDeath),
        ageAtDeath: input.ageAtDeath || null,
        suspectedCause: input.suspectedCause || null,
        confirmedCause: input.confirmedCause || null,
        vetDiagnosis: input.vetDiagnosis || null,
        notes: input.notes || null,
      },
    }),
    prisma.goat.update({ where: { id: input.goatId }, data: { status: "DEAD" } }),
  ]);
  revalidatePath("/herd");
  revalidatePath("/dashboard");
  revalidatePath(`/herd/${input.goatId}`);
  return rec;
}

export async function recordCulling(input: { goatId: string; date: string; reason: string; notes?: string }) {
  const { farmId, role } = await requireFarmSession();
  assertCanDelete(role);
  const [rec] = await prisma.$transaction([
    prisma.cullingRecord.create({ data: { farmId, goatId: input.goatId, date: new Date(input.date), reason: input.reason, notes: input.notes || null } }),
    prisma.goat.update({ where: { id: input.goatId }, data: { status: "CULLED" } }),
  ]);
  revalidatePath("/herd");
  revalidatePath(`/herd/${input.goatId}`);
  return rec;
}

/* ---------------- Tasks / reminders ---------------- */

export async function addTask(input: { title: string; category?: string; dueDate: string; goatId?: string | null }) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.task.create({
    data: { farmId, title: input.title, category: input.category || "General", dueDate: new Date(input.dueDate), goatId: input.goatId || null },
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return rec;
}

export async function toggleTask(taskId: string, done: boolean) {
  const { farmId } = await requireFarmSession();
  const task = await prisma.task.findFirst({ where: { id: taskId, farmId } });
  if (!task) throw new Error("Task not found on this farm.");
  await prisma.task.update({ where: { id: taskId }, data: { done, doneAt: done ? new Date() : null } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(taskId: string) {
  const { farmId, role } = await requireFarmSession();
  const task = await prisma.task.findFirst({ where: { id: taskId, farmId } });
  if (!task) throw new Error("Task not found on this farm.");
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
}
