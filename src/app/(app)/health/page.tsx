import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";
import BulkVaxForm from "@/components/forms/BulkVaxForm";

export default async function HealthPage() {
  const { farmId } = await requireFarmSession();
  const [goats, recentVax, recentHealth] = await Promise.all([
    prisma.goat.findMany({ where: { farmId, status: { notIn: ["DEAD", "SOLD"] } } }),
    prisma.vaccinationRecord.findMany({ where: { farmId }, include: { goat: true }, orderBy: { date: "desc" }, take: 15 }),
    prisma.healthRecord.findMany({ where: { farmId }, include: { goat: true }, orderBy: { date: "desc" }, take: 15 }),
  ]);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="font-bold text-sm mb-2" style={{ color: "var(--olive-dark)" }}>💉 Bulk Vaccination</div>
        <BulkVaxForm goats={goats.map((g) => ({ id: g.id, name: g.name, tagId: g.tagId }))} />
      </div>
      <div className="card p-4">
        <div className="font-bold text-sm mb-2" style={{ color: "var(--olive-dark)" }}>Recent Vaccinations</div>
        {recentVax.map((v) => (
          <div key={v.id} className="flex justify-between text-sm border-b py-1.5" style={{ borderColor: "var(--sand)" }}>
            <span>{v.goat.name} — {v.vaccine}</span><span className="text-gray-400">{fmtDate(v.date)}</span>
          </div>
        ))}
        {recentVax.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">No vaccinations logged yet.</div>}
      </div>
      <div className="card p-4">
        <div className="font-bold text-sm mb-2" style={{ color: "var(--olive-dark)" }}>🩺 Recent Health Records</div>
        <div className="text-xs text-gray-400 mb-2">Add health records from a goat's profile page.</div>
        {recentHealth.map((h) => (
          <div key={h.id} className="flex justify-between text-sm border-b py-1.5" style={{ borderColor: "var(--sand)" }}>
            <span>{h.goat.name} — {h.diagnosis || h.symptoms || "checkup"}</span><span className="text-gray-400">{fmtDate(h.date)}</span>
          </div>
        ))}
        {recentHealth.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">No health records yet.</div>}
      </div>
    </div>
  );
}
