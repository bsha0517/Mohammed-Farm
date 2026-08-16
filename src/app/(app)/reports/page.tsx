import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { money } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active", KID: "Kid", BREEDING: "Breeding", PREGNANT: "Pregnant", LACTATING: "Lactating",
  FOR_SALE: "For Sale", SOLD: "Sold", DEAD: "Dead", CULLED: "Culled",
};

export default async function ReportsPage() {
  const { farmId } = await requireFarmSession();

  const [goats, breeding, kiddings, health, vaccinations, expenses, sales] = await Promise.all([
    prisma.goat.findMany({ where: { farmId } }),
    prisma.breedingRecord.findMany({ where: { farmId } }),
    prisma.kiddingRecord.findMany({ where: { farmId } }),
    prisma.healthRecord.findMany({ where: { farmId } }),
    prisma.vaccinationRecord.findMany({ where: { farmId } }),
    prisma.expense.findMany({ where: { farmId } }),
    prisma.saleRecord.findMany({ where: { farmId } }),
  ]);

  const byStatus = Object.entries(STATUS_LABELS)
    .map(([key, label]) => ({ label, n: goats.filter((g) => g.status === key).length }))
    .filter((x) => x.n > 0);

  const totalKids = kiddings.reduce((s, k) => s + k.totalBorn, 0);
  const aliveKids = kiddings.reduce((s, k) => s + k.bornAlive, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSales = sales.reduce((s, x) => s + x.price, 0);
  const vetCost = health.reduce((s, h) => s + h.cost, 0);

  const Row = ({ label, value }: { label: string; value: any }) => (
    <div className="flex justify-between border-b py-1.5" style={{ borderColor: "var(--sand)" }}>
      <span className="text-gray-500">{label}</span><span className="font-semibold text-right">{value}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-col gap-2">
        <a href="/reports/print" className="btn btn-primary text-center">🖨 Print / Save Full Report as PDF</a>
        <div className="text-xs font-semibold mt-1" style={{ color: "var(--olive-dark)" }}>Download as CSV (opens in Excel)</div>
        <div className="grid grid-cols-2 gap-2">
          <a href="/api/export?type=goats" className="btn btn-ghost text-center text-xs">Goats</a>
          <a href="/api/export?type=breeding" className="btn btn-ghost text-center text-xs">Breeding</a>
          <a href="/api/export?type=kidding" className="btn btn-ghost text-center text-xs">Kidding</a>
          <a href="/api/export?type=health" className="btn btn-ghost text-center text-xs">Health</a>
          <a href="/api/export?type=vaccinations" className="btn btn-ghost text-center text-xs">Vaccinations</a>
          <a href="/api/export?type=finance" className="btn btn-ghost text-center text-xs">Expenses</a>
          <a href="/api/export?type=sales" className="btn btn-ghost text-center text-xs col-span-2">Sales</a>
        </div>
      </div>

      <div className="card p-4">
        <div className="font-bold text-sm" style={{ color: "var(--olive-dark)" }}>Herd Report</div>
        <div className="mt-2">{byStatus.map((b) => <Row key={b.label} label={b.label} value={b.n} />)}</div>
      </div>
      <div className="card p-4">
        <div className="font-bold text-sm" style={{ color: "var(--olive-dark)" }}>Breeding Report</div>
        <Row label="Total matings" value={breeding.length} />
        <Row label="Currently pregnant" value={breeding.filter((b) => b.pregStatus === "PREGNANT").length} />
        <Row label="Total kiddings" value={kiddings.length} />
        <Row label="Kids born" value={totalKids} />
        <Row label="Kids alive" value={aliveKids} />
        <Row label="Kid survival rate" value={totalKids ? `${((aliveKids / totalKids) * 100).toFixed(1)}%` : "—"} />
      </div>
      <div className="card p-4">
        <div className="font-bold text-sm" style={{ color: "var(--olive-dark)" }}>Health & Vaccination</div>
        <Row label="Health records" value={health.length} />
        <Row label="Vaccinations given" value={vaccinations.length} />
        <Row label="Vet/medicine cost" value={money(vetCost)} />
      </div>
      <div className="card p-4">
        <div className="font-bold text-sm" style={{ color: "var(--olive-dark)" }}>Financial Report</div>
        <Row label="Total expenses" value={money(totalExpense)} />
        <Row label="Total sales income" value={money(totalSales)} />
        <Row label="Net cash flow" value={money(totalSales - totalExpense)} />
      </div>
      <div className="text-center text-xs text-gray-400 pb-2">Reports reflect live data at the moment you view or print them.</div>
    </div>
  );
}
