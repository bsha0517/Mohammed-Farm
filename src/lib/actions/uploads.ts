"use server";

import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB — plenty for a phone photo, keeps storage costs sane
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

export async function uploadGoatPhoto(formData: FormData) {
  const { farmId } = await requireFarmSession();

  const goatId = formData.get("goatId") as string;
  const file = formData.get("file") as File | null;
  const makePrimary = formData.get("makePrimary") === "true";

  if (!goatId) throw new Error("Missing goat.");
  if (!file || file.size === 0) throw new Error("No file selected.");

  const goat = await prisma.goat.findFirst({ where: { id: goatId, farmId } });
  if (!goat) throw new Error("Goat not found on this farm.");
  if (file.size > MAX_BYTES) throw new Error("Photo is too large — please use one under 5MB.");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("Please upload a JPG, PNG, WEBP, or HEIC photo.");

  const blob = await put(`farms/${farmId}/goats/${goatId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  if (makePrimary) {
    await prisma.goatPhoto.updateMany({ where: { goatId }, data: { isPrimary: false } });
  }

  const photo = await prisma.goatPhoto.create({
    data: { goatId, url: blob.url, isPrimary: makePrimary },
  });

  revalidatePath(`/herd/${goatId}`);
  return photo;
}

export async function setPrimaryPhoto(photoId: string, goatId: string) {
  const { farmId } = await requireFarmSession();
  const goat = await prisma.goat.findFirst({ where: { id: goatId, farmId } });
  if (!goat) throw new Error("Goat not found on this farm.");

  await prisma.$transaction([
    prisma.goatPhoto.updateMany({ where: { goatId }, data: { isPrimary: false } }),
    prisma.goatPhoto.update({ where: { id: photoId }, data: { isPrimary: true } }),
  ]);
  revalidatePath(`/herd/${goatId}`);
}

export async function deleteGoatPhoto(photoId: string, goatId: string) {
  const { farmId } = await requireFarmSession();
  const goat = await prisma.goat.findFirst({ where: { id: goatId, farmId } });
  if (!goat) throw new Error("Goat not found on this farm.");

  const photo = await prisma.goatPhoto.findUnique({ where: { id: photoId } });
  if (photo) {
    await del(photo.url).catch(() => {}); // best-effort — don't block the DB delete if blob is already gone
    await prisma.goatPhoto.delete({ where: { id: photoId } });
  }
  revalidatePath(`/herd/${goatId}`);
}

/* ---------------- Documents (prescriptions, receipts, lab reports) ---------------- */

export async function uploadDocument(formData: FormData) {
  const { farmId } = await requireFarmSession();

  const goatId = (formData.get("goatId") as string) || null;
  const type = formData.get("type") as string;
  const label = (formData.get("label") as string) || undefined;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) throw new Error("No file selected.");
  if (file.size > MAX_BYTES) throw new Error("File is too large — please use one under 5MB.");
  if (!ALLOWED_DOC_TYPES.includes(file.type)) throw new Error("Please upload a JPG, PNG, WEBP, HEIC image or a PDF.");

  if (goatId) {
    const goat = await prisma.goat.findFirst({ where: { id: goatId, farmId } });
    if (!goat) throw new Error("Goat not found on this farm.");
  }

  const blob = await put(`farms/${farmId}/documents/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const doc = await prisma.document.create({
    data: { farmId, goatId, type, url: blob.url, label: label || null },
  });

  if (goatId) revalidatePath(`/herd/${goatId}`);
  return doc;
}

export async function deleteDocument(documentId: string) {
  const { farmId } = await requireFarmSession();
  const doc = await prisma.document.findFirst({ where: { id: documentId, farmId } });
  if (!doc) throw new Error("Document not found on this farm.");

  await del(doc.url).catch(() => {});
  await prisma.document.delete({ where: { id: documentId } });
  if (doc.goatId) revalidatePath(`/herd/${doc.goatId}`);
}
