import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

const EXPORTS: Record<string, (farmId: string) => Promise<Record<string, any>[]>> = {
  goats: (farmId) =>
    prisma.goat.findMany({ where: { farmId }, orderBy: { tagId: "asc" } }).then((rows) =>
      rows.map((g) => ({
        tagId: g.tagId, name: g.name, sex: g.sex, breed: g.breed, dob: g.dob, status: g.status,
        earTag: g.earTag, motherId: g.motherId, fatherId: g.fatherId, origin: g.origin,
        purchasePrice: g.purchasePrice,
      }))
    ),
  breeding: (farmId) =>
    prisma.breedingRecord.findMany({ where: { farmId }, include: { female: true, male: true }, orderBy: { matingDate: "desc" } }).then((rows) =>
      rows.map((b) => ({
        female: b.female.name, femaleTagId: b.female.tagId, male: b.male.name, maleTagId: b.male.tagId,
        matingDate: b.matingDate, method: b.method, expectedKidding: b.expectedKidding, pregStatus: b.pregStatus,
      }))
    ),
  kidding: (farmId) =>
    prisma.kiddingRecord.findMany({ where: { farmId }, include: { mother: true, father: true }, orderBy: { kiddingDate: "desc" } }).then((rows) =>
      rows.map((k) => ({
        mother: k.mother.name, father: k.father?.name || "", kiddingDate: k.kiddingDate, totalBorn: k.totalBorn,
        bornAlive: k.bornAlive, stillborn: k.stillborn, maleKids: k.maleKids, femaleKids: k.femaleKids,
      }))
    ),
  health: (farmId) =>
    prisma.healthRecord.findMany({ where: { farmId }, include: { goat: true }, orderBy: { date: "desc" } }).then((rows) =>
      rows.map((h) => ({ goat: h.goat.name, goatTagId: h.goat.tagId, date: h.date, symptoms: h.symptoms, diagnosis: h.diagnosis, treatment: h.treatment, cost: h.cost }))
    ),
  vaccinations: (farmId) =>
    prisma.vaccinationRecord.findMany({ where: { farmId }, include: { goat: true }, orderBy: { date: "desc" } }).then((rows) =>
      rows.map((v) => ({ goat: v.goat.name, goatTagId: v.goat.tagId, vaccine: v.vaccine, date: v.date, nextDue: v.nextDue }))
    ),
  finance: (farmId) =>
    prisma.expense.findMany({ where: { farmId }, orderBy: { date: "desc" } }).then((rows) =>
      rows.map((e) => ({ type: "Expense", date: e.date, category: e.category, description: e.description, amount: e.amount }))
    ),
  sales: (farmId) =>
    prisma.saleRecord.findMany({ where: { farmId }, include: { goat: true }, orderBy: { saleDate: "desc" } }).then((rows) =>
      rows.map((s) => ({ goat: s.goat.name, goatTagId: s.goat.tagId, buyer: s.buyer, saleDate: s.saleDate, price: s.price, purpose: s.purpose }))
    ),
};

export async function GET(req: NextRequest) {
  const { farmId } = await requireFarmSession();
  const type = req.nextUrl.searchParams.get("type") || "goats";

  const fn = EXPORTS[type];
  if (!fn) return NextResponse.json({ error: "Unknown export type" }, { status: 400 });

  const rows = await fn(farmId);
  const csv = toCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
