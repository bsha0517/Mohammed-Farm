import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { money, fmtDate } from "@/lib/utils";
import ExpenseForm from "@/components/forms/ExpenseForm";
import SaleForm from "@/components/forms/SaleForm";

export default async function FinancePage() {
  const { farmId } = await requireFarmSession();
  const [expenses, sales, goats] = await Promise.all([
    prisma.expense.findMany({ where: { farmId }, orderBy: { date: "desc" } }),
    prisma.saleRecord.findMany({ where: { farmId }, include: { goat: true }, orderBy: { saleDate: "desc" } }),
    prisma.goat.findMany({ where: { farmId, status: { notIn: ["DEAD", "SOLD"] } } }),
  ]);

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSales = sales.reduce((s, x) => s + x.price, 0);
  const net = totalSales - totalExpense;

  const byCat = Object.entries(
    expenses.reduce((acc: Record<string, number>, e) => ({ ...acc, [e.category]: (acc[e.category] || 0) + e.amount }), {})
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-3 text-center bg-white border" style={{ borderColor: "var(--sand-deep)" }}><div className="text-xs text-gray-500">Expenses</div><div className="font-bold" style={{ color: "var(--red)" }}>{money(totalExpense)}</div></div>
        <div className="rounded-xl p-3 text-center bg-white border" style={{ borderColor: "var(--sand-deep)" }}><div className="text-xs text-gray-500">Income</div><div className="font-bold" style={{ color: "var(--olive)" }}>{money(totalSales)}</div></div>
        <div className="rounded-xl p-3 text-center bg-white border" style={{ borderColor: "var(--sand-deep)" }}><div className="text-xs text-gray-500">Net</div><div className="font-bold" style={{ color: net >= 0 ? "var(--olive)" : "var(--red)" }}>{money(net)}</div></div>
      </div>

      <div className="card p-4">
        <div className="font-bold text-sm mb-2" style={{ color: "var(--olive-dark)" }}>Expenses</div>
        <details className="mb-3"><summary className="text-xs font-semibold cursor-pointer" style={{ color: "var(--olive-dark)" }}>+ Add expense</summary><div className="mt-2"><ExpenseForm goats={goats.map((g) => ({ id: g.id, name: g.name }))} /></div></details>
        {expenses.slice(0, 10).map((e) => (
          <div key={e.id} className="flex justify-between text-sm border-b py-1.5" style={{ borderColor: "var(--sand)" }}>
            <span>{e.category}{e.description ? ` — ${e.description}` : ""}</span><span>{money(e.amount)}</span>
          </div>
        ))}
        {expenses.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">No expenses logged.</div>}
        {byCat.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--sand)" }}>
            {byCat.map(([c, total]) => <div key={c} className="flex justify-between text-xs text-gray-500 py-0.5"><span>{c}</span><span>{money(total)}</span></div>)}
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="font-bold text-sm mb-2" style={{ color: "var(--olive-dark)" }}>Sales</div>
        <details className="mb-3"><summary className="text-xs font-semibold cursor-pointer" style={{ color: "var(--olive-dark)" }}>+ Add sale</summary><div className="mt-2"><SaleForm goats={goats.map((g) => ({ id: g.id, name: g.name }))} /></div></details>
        {sales.map((s) => (
          <div key={s.id} className="flex justify-between text-sm border-b py-1.5" style={{ borderColor: "var(--sand)" }}>
            <span>{s.goat.name} → {s.buyer}</span><span>{money(s.price)}</span>
          </div>
        ))}
        {sales.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">No sales logged.</div>}
      </div>
    </div>
  );
}
