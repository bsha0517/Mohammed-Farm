import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { money, fmtDate } from "@/lib/utils";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active", KID: "Kid", BREEDING: "Breeding", PREGNANT: "Pregnant", LACTATING: "Lactating",
  FOR_SALE: "For Sale", SOLD: "Sold", DEAD: "Dead", CULLED: "Culled",
};

export default async function ReportsPrintPage() {
  const { farmId } = await requireFarmSession();
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });

  const [goats, breeding, kiddings, health, vaccinations, expenses, sales] = await Promise.all([
    prisma.goat.findMany({ where: { farmId } }),
    prisma.breedingRecord.findMany({ where: { farmId } }),
    prisma.kiddingRecord.findMany({ where: { farmId } }),
    prisma.healthRecord.findMany({ where: { farmId } }),
    prisma.vaccinationRecord.findMany({ where: { farmId } }),
    prisma.expense.findMany({ where: { farmId } }),
    prisma.saleRecord.findMany({ where: { farmId } }),
  ]);

  const byStatus = Object.entries(STATUS_LABELS).map(([key, label]) => ({ label, n: goats.filter((g) => g.status === key).length })).filter((x) => x.n > 0);
  const totalKids = kiddings.reduce((s, k) => s + k.totalBorn, 0);
  const aliveKids = kiddings.reduce((s, k) => s + k.bornAlive, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSales = sales.reduce((s, x) => s + x.price, 0);
  const vetCost = health.reduce((s, h) => s + h.cost, 0);

  const Row = ({ label, value }: { label: string; value: any }) => (
    <div className="flex justify-between border-b py-1" style={{ borderColor: "#ddd" }}><span>{label}</span><span className="font-semibold">{value}</span></div>
  );

  return (
    <div>
      <div className="print:hidden flex items-center justify-between mb-4">
        <Link href="/reports" className="text-sm font-semibold" style={{ color: "var(--olive-dark)" }}>← Back</Link>
        <PrintButton label="Print / Save as PDF" />
      </div>

      <div className="bg-white p-6 rounded-2xl print:rounded-none print:p-0">
        <div className="text-center mb-6 print:mb-4">
          <div className="text-lg font-bold">{farm?.name}</div>
          <div className="text-sm text-gray-500">{farm?.location}</div>
          <div className="text-xs text-gray-400 mt-1">Farm Report — generated {fmtDate(new Date())}</div>
        </div>

        <div className="mb-4">
          <div className="font-bold text-sm mb-1">Herd Summary</div>
          {byStatus.map((b) => <Row key={b.label} label={b.label} value={b.n} />)}
        </div>

        <div className="mb-4">
          <div className="font-bold text-sm mb-1">Breeding & Kidding</div>
          <Row label="Total matings" value={breeding.length} />
          <Row label="Currently pregnant" value={breeding.filter((b) => b.pregStatus === "PREGNANT").length} />
          <Row label="Total kiddings" value={kiddings.length} />
          <Row label="Kids born" value={totalKids} />
          <Row label="Kids alive" value={aliveKids} />
          <Row label="Kid survival rate" value={totalKids ? `${((aliveKids / totalKids) * 100).toFixed(1)}%` : "—"} />
        </div>

        <div className="mb-4">
          <div className="font-bold text-sm mb-1">Health & Vaccination</div>
          <Row label="Health records" value={health.length} />
          <Row label="Vaccinations given" value={vaccinations.length} />
          <Row label="Vet/medicine cost" value={money(vetCost)} />
        </div>

        <div className="mb-2">
          <div className="font-bold text-sm mb-1">Financial Summary</div>
          <Row label="Total expenses" value={money(totalExpense)} />
          <Row label="Total sales income" value={money(totalSales)} />
          <Row label="Net cash flow" value={money(totalSales - totalExpense)} />
        </div>

        <div className="text-[10px] text-gray-400 mt-6 text-center print:mt-4">
          This is a summary report, not exact accounting. Generated from 8-4L Teddy Farm Goat Management System.
        </div>
      </div>
    </div>
  );
}
