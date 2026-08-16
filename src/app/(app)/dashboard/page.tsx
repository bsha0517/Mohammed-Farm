import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { fmtDate, daysBetween, todayISO } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const { farmId } = await requireFarmSession();

  const goats = await prisma.goat.findMany({ where: { farmId } });
  const active = goats.filter((g) => !["DEAD", "SOLD"].includes(g.status));
  const females = active.filter((g) => g.sex === "FEMALE");
  const males = active.filter((g) => g.sex === "MALE");

  const summary = {
    total: active.length,
    females: females.length,
    males: males.length,
    breedingFemales: females.filter((g) => ["BREEDING", "PREGNANT", "LACTATING"].includes(g.status)).length,
    pregnant: goats.filter((g) => g.status === "PREGNANT").length,
    kids: goats.filter((g) => g.status === "KID").length,
    forSale: goats.filter((g) => g.status === "FOR_SALE").length,
    deceased: goats.filter((g) => g.status === "DEAD").length,
  };

  const breedingRecs = await prisma.breedingRecord.findMany({
    where: { farmId, pregStatus: { in: ["MATED", "NOT_CONFIRMED", "PREGNANT"] }, expectedKidding: { not: null } },
    include: { female: true },
  });
  const upcomingKiddings = breedingRecs
    .map((b) => ({ ...b, days: daysBetween(todayISO(), b.expectedKidding!) }))
    .filter((b) => b.days >= -3 && b.days <= 21)
    .sort((a, b) => a.days - b.days);

  const vax = await prisma.vaccinationRecord.findMany({ where: { farmId, nextDue: { not: null } }, include: { goat: true } });
  const upcomingVax = vax
    .map((v) => ({ ...v, days: daysBetween(todayISO(), v.nextDue!) }))
    .filter((v) => v.days <= 14)
    .sort((a, b) => a.days - b.days);

  const openTasks = await prisma.task.findMany({ where: { farmId, done: false }, orderBy: { dueDate: "asc" }, take: 5 });

  const inventoryItems = await prisma.inventoryItem.findMany({ where: { farmId } });
  const lowStock = inventoryItems.filter((i) => i.minimumStockLevel != null && i.quantity <= i.minimumStockLevel);
  const expiringSoon = inventoryItems.filter((i) => i.expiryDate && daysBetween(todayISO(), i.expiryDate) <= 30);

  const [recentKiddings, recentBreeding, recentVax, recentHealth, recentSales] = await Promise.all([
    prisma.kiddingRecord.findMany({ where: { farmId }, include: { mother: true }, orderBy: { kiddingDate: "desc" }, take: 4 }),
    prisma.breedingRecord.findMany({ where: { farmId }, include: { female: true, male: true }, orderBy: { matingDate: "desc" }, take: 4 }),
    prisma.vaccinationRecord.findMany({ where: { farmId }, include: { goat: true }, orderBy: { date: "desc" }, take: 4 }),
    prisma.healthRecord.findMany({ where: { farmId }, include: { goat: true }, orderBy: { date: "desc" }, take: 4 }),
    prisma.saleRecord.findMany({ where: { farmId }, include: { goat: true }, orderBy: { saleDate: "desc" }, take: 4 }),
  ]);

  const activity = [
    ...recentKiddings.map((k) => ({ date: k.kiddingDate, text: `${k.mother.name} kidded — ${k.totalBorn} kid(s)`, icon: "🐐" })),
    ...recentBreeding.map((b) => ({ date: b.matingDate, text: `Mating recorded: ${b.female.name} × ${b.male.name}`, icon: "💞" })),
    ...recentVax.map((v) => ({ date: v.date, text: `${v.goat.name} vaccinated — ${v.vaccine}`, icon: "💉" })),
    ...recentHealth.map((h) => ({ date: h.date, text: `${h.goat.name} treated — ${h.diagnosis || h.symptoms || "checkup"}`, icon: "🩺" })),
    ...recentSales.map((s) => ({ date: s.saleDate, text: `${s.goat.name} sold for Rs ${s.price.toLocaleString()}`, icon: "💰" })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);

  const Stat = ({ label, value, color }: { label: string; value: number; color?: string }) => (
    <div className="rounded-xl p-3 text-center bg-white border" style={{ borderColor: "var(--sand-deep)" }}>
      <div className="text-2xl font-extrabold" style={{ color: color || "var(--ink)" }}>{value}</div>
      <div className="text-[11px] font-medium text-gray-500">{label}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Total" value={summary.total} />
        <Stat label="Females" value={summary.females} color="var(--clay)" />
        <Stat label="Males" value={summary.males} color="var(--olive)" />
        <Stat label="Kids" value={summary.kids} color="var(--gold)" />
        <Stat label="Breeding ♀" value={summary.breedingFemales} />
        <Stat label="Pregnant" value={summary.pregnant} color="var(--clay)" />
        <Stat label="For Sale" value={summary.forSale} />
        <Stat label="Deceased" value={summary.deceased} color="var(--red)" />
      </div>

      {upcomingKiddings.length > 0 && (
        <div className="card p-4">
          <div className="font-bold text-sm" style={{ color: "var(--olive-dark)" }}>🐣 Kidding Alerts</div>
          <div className="space-y-2 mt-2">
            {upcomingKiddings.map((b) => (
              <Link key={b.id} href={`/herd/${b.femaleId}`} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--sand)" }}>
                <div>
                  <div className="font-bold">{b.female.name}</div>
                  <div className="text-xs text-gray-500">Expected: {fmtDate(b.expectedKidding)}</div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#F5E1D8", color: "var(--clay)" }}>
                  {b.days <= 0 ? "Due now" : `${b.days}d left`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {upcomingVax.length > 0 && (
        <div className="card p-4">
          <div className="font-bold text-sm" style={{ color: "var(--olive-dark)" }}>💉 Vaccinations Due</div>
          <div className="space-y-2 mt-2">
            {upcomingVax.map((v) => (
              <Link key={v.id} href={`/herd/${v.goatId}`} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--sand)" }}>
                <div>
                  <div className="font-bold">{v.goat.name}</div>
                  <div className="text-xs text-gray-500">{v.vaccine} · due {fmtDate(v.nextDue)}</div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#F7EBCE", color: "#8A6A1E" }}>
                  {v.days <= 0 ? "Overdue" : `${v.days}d`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(lowStock.length > 0 || expiringSoon.length > 0) && (
        <Link href="/inventory" className="card p-4 block" style={{ borderColor: "var(--clay)" }}>
          <div className="font-bold text-sm" style={{ color: "var(--clay)" }}>⚠ Inventory Alerts</div>
          <div className="text-xs text-gray-500 mt-1">
            {lowStock.length > 0 && `${lowStock.length} item(s) low on stock`}
            {lowStock.length > 0 && expiringSoon.length > 0 && " · "}
            {expiringSoon.length > 0 && `${expiringSoon.length} item(s) expiring within 30 days`}
          </div>
        </Link>
      )}

      {openTasks.length > 0 && (
        <div className="card p-4">
          <div className="font-bold text-sm" style={{ color: "var(--olive-dark)" }}>✅ Upcoming Tasks</div>
          <div className="space-y-2 mt-2">
            {openTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--sand)" }}>
                <div className="font-medium text-sm">{t.title}</div>
                <span className="text-xs text-gray-500">{fmtDate(t.dueDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="font-bold text-sm" style={{ color: "var(--olive-dark)" }}>🕒 Recent Activity</div>
        <div className="mt-2 space-y-2">
          {activity.length === 0 && <div className="text-sm text-gray-400 py-4 text-center">No activity yet — start by adding a goat.</div>}
          {activity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span>{a.icon}</span>
              <div className="flex-1">
                <div>{a.text}</div>
                <div className="text-[11px] text-gray-400">{fmtDate(a.date)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
