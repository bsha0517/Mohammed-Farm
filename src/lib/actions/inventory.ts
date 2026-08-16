"use server";

import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { daysBetween, todayISO } from "@/lib/utils";

/* ---------------- Inventory ---------------- */

export async function addInventoryItem(input: {
  item: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate?: string;
  cost?: number;
  supplier?: string;
  expiryDate?: string;
  minimumStockLevel?: number;
}) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.inventoryItem.create({
    data: {
      farmId,
      item: input.item,
      category: input.category,
      quantity: input.quantity,
      unit: input.unit,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      cost: input.cost ?? null,
      supplier: input.supplier || null,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      minimumStockLevel: input.minimumStockLevel ?? null,
    },
  });
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return rec;
}

export async function adjustInventoryQuantity(itemId: string, newQuantity: number) {
  const { farmId } = await requireFarmSession();
  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, farmId } });
  if (!item) throw new Error("Inventory item not found on this farm.");
  await prisma.inventoryItem.update({ where: { id: itemId }, data: { quantity: newQuantity } });
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

/** Items at/below their minimum stock level, or expiring within 30 days — spec section 14. */
export async function getInventoryAlerts() {
  const { farmId } = await requireFarmSession();
  const items = await prisma.inventoryItem.findMany({ where: { farmId } });
  const lowStock = items.filter((i) => i.minimumStockLevel != null && i.quantity <= i.minimumStockLevel);
  const expiringSoon = items
    .filter((i) => i.expiryDate)
    .map((i) => ({ ...i, daysToExpiry: daysBetween(todayISO(), i.expiryDate!) }))
    .filter((i) => i.daysToExpiry <= 30);
  return { lowStock, expiringSoon };
}

/* ---------------- Feed types & feeding records ---------------- */

export async function addFeedType(name: string) {
  const { farmId } = await requireFarmSession();
  const existing = await prisma.feedType.findFirst({ where: { farmId, name } });
  if (existing) return existing;
  const rec = await prisma.feedType.create({ data: { farmId, name } });
  revalidatePath("/inventory");
  return rec;
}


export async function addFeedingRecord(input: { date: string; feedTypeId: string; quantity: number; unit: string; animalGroup: string; cost?: number; notes?: string }) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.feedingRecord.create({
    data: {
      farmId,
      date: new Date(input.date),
      feedTypeId: input.feedTypeId,
      quantity: input.quantity,
      unit: input.unit,
      animalGroup: input.animalGroup,
      cost: input.cost || 0,
      notes: input.notes || null,
    },
  });
  revalidatePath("/inventory");
  return rec;
}
