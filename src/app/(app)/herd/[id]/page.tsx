import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { getPedigreeTree } from "@/lib/pedigree";
import { getFemaleReproStats } from "@/lib/actions/kidding";
import { getGoatProfitability } from "@/lib/actions/finance";
import { fmtDate, ageString, money } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import HealthForm from "@/components/forms/HealthForm";
import VaccinationForm from "@/components/forms/VaccinationForm";
import WeightForm from "@/components/forms/WeightForm";

const TABS = [
  ["info", "Info"], ["pedigree", "Pedigree"], ["health", "Health"], ["vax", "Vaccines"], ["weight", "Weight"], ["repro", "Breeding"], ["money", "Profit"],
];

export default async function GoatProfilePage({ params, searchParams }: { params: { id: string }; searchParams: { tab?: string } }) {
  const { farmId } = await requireFarmSession();
  const goat = await prisma.goat.findFirst({ where: { id: params.id, farmId } });
  if (!goat) notFound();

  const tab = searchParams.tab || "info";
  const tree = await getPedigreeTree(goat.id);
  const children = await prisma.goat.findMany({ where: { OR: [{ motherId: goat.id }, { fatherId: goat.id }] } });

  const [health, vax, weights, repro] = await Promise.all([
    tab === "health" ? prisma.healthRecord.findMany({ where: { goatId: goat.id }, orderBy: { date: "desc" } }) : [],
    tab === "vax" ? prisma.vaccinationRecord.findMany({ where: { goatId: goat.id }, orderBy: { date: "desc" } }) : [],
    tab === "weight" ? prisma.weightRecord.findMany({ where: { goatId: goat.id }, orderBy: { date: "asc" } }) : [],
    tab === "repro" && goat.sex === "FEMALE" ? getFemaleReproStats(goat.id) : null,
  ]);
  const profitability = tab === "money" ? await getGoatProfitability(goat.id) : null;

  const lastWeight = weights[weights.length - 1];
  const gain = weights.length > 1 ? (lastWeight.weightKg - weights[0].weightKg).toFixed(1) : null;

  const Node = ({ g }: { g: { id: string; name: string } | null | undefined }) =>
    g ? (
      <Link href={`/herd/${g.id}`} className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-center w-full block bg-white" style={{ border: "1px solid var(--sand-deep)" }}>
        {g.name}
      </Link>
    ) : (
      <div className="px-2 py-1.5 rounded-lg text-[11px] text-center w-full" style={{ background: "var(--sand)", color: "#B0A78F" }}>Unknown</div>
    );

  return (
    <div>
      <Link href="/herd" className="text-sm font-semibold" style={{ color: "var(--olive-dark)" }}>← Back</Link>

      <div className="card p-4 my-3">
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{ background: "var(--sand-deep)" }}>
            {goat.sex === "MALE" ? "🐐" : "🐏"}
          </div>
          <div className="flex-1">
            <div className="font-extrabold text-lg" style={{ fontFamily: "Georgia, serif" }}>{goat.name}</div>
            <div className="text-xs text-gray-500">{goat.tagId} · {goat.breed} · {goat.sex === "MALE" ? "Male" : "Female"}</div>
            <div className="text-xs text-gray-500">Born {fmtDate(goat.dob)} · {ageString(goat.dob)} old</div>
            <div className="mt-1"><span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#E8EFE3", color: "#374F2A" }}>{goat.status.replace("_", " ")}</span></div>
          </div>
          <div className="flex flex-col gap-1.5 self-start">
            <Link href={`/herd/${goat.id}/edit`} className="btn btn-ghost text-center">Edit</Link>
            <Link href={`/herd/${goat.id}/print`} className="text-[11px] font-semibold text-center" style={{ color: "var(--olive-dark)" }}>🏷 QR tag</Link>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto mb-3 pb-1">
        {TABS.filter(([k]) => k !== "repro" || goat.sex === "FEMALE").map(([k, label]) => (
          <Link key={k} href={`/herd/${goat.id}?tab=${k}`} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{ background: tab === k ? "var(--olive)" : "white", color: tab === k ? "white" : "var(--olive-dark)", border: "1px solid var(--sand-deep)" }}>
            {label}
          </Link>
        ))}
      </div>

      {tab === "info" && (
        <div className="card p-4 space-y-2 text-sm">
          <Row label="Ear tag" value={goat.earTag || "—"} />
          <Row label="Color / marks" value={goat.color || "—"} />
          <Row label="Origin" value={goat.origin === "PURCHASED" ? "Purchased" : "Born on farm"} />
          {goat.origin === "PURCHASED" && (
            <>
              <Row label="Purchase date" value={fmtDate(goat.purchaseDate)} />
              <Row label="Purchase price" value={`Rs ${(goat.purchasePrice || 0).toLocaleString()}`} />
              <Row label="Seller" value={goat.seller || "—"} />
            </>
          )}
          <Row label="Notes" value={goat.notes || "—"} />
        </div>
      )}

      {tab === "pedigree" && tree && (
        <div className="card p-4">
          <div className="space-y-2 text-center">
            <div className="grid grid-cols-4 gap-1"><Node g={tree.pgf} /><Node g={tree.pgm} /><Node g={tree.mgf} /><Node g={tree.mgm} /></div>
            <div className="text-gray-300 text-xs">↓</div>
            <div className="grid grid-cols-2 gap-1"><Node g={tree.father} /><Node g={tree.mother} /></div>
            <div className="text-gray-300 text-xs">↓</div>
            <div className="px-2 py-2 rounded-lg font-bold text-sm text-white" style={{ background: "var(--olive)" }}>{goat.name}</div>
          </div>
          {children.length > 0 && (
            <div className="mt-4">
              <div className="font-bold text-sm" style={{ color: "var(--olive-dark)" }}>Offspring ({children.length})</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {children.map((c) => (
                  <Link key={c.id} href={`/herd/${c.id}`} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--sand)" }}>
                    {c.name} ({c.sex === "MALE" ? "♂" : "♀"})
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "health" && (
        <div className="space-y-3">
          <details className="card p-4"><summary className="font-semibold cursor-pointer">+ Add health record</summary><div className="mt-3"><HealthForm goatId={goat.id} /></div></details>
          {health.map((h) => (
            <div key={h.id} className="card p-3 text-sm">
              <div className="flex justify-between"><b>{fmtDate(h.date)}</b><span className="text-gray-500">Rs {h.cost.toLocaleString()}</span></div>
              {h.symptoms && <div>Symptoms: {h.symptoms}</div>}
              {h.diagnosis && <div>Diagnosis: {h.diagnosis}</div>}
              {h.treatment && <div>Treatment: {h.treatment}</div>}
            </div>
          ))}
          {health.length === 0 && <div className="text-center text-gray-400 py-6 text-sm">No health records yet.</div>}
        </div>
      )}

      {tab === "vax" && (
        <div className="space-y-3">
          <details className="card p-4"><summary className="font-semibold cursor-pointer">+ Add vaccination</summary><div className="mt-3"><VaccinationForm goatId={goat.id} /></div></details>
          {vax.map((v) => (
            <div key={v.id} className="card p-3 text-sm flex justify-between">
              <div><b>{v.vaccine}</b><div className="text-xs text-gray-500">Given {fmtDate(v.date)}</div></div>
              {v.nextDue && <div className="text-xs text-right text-gray-500">Next due<br /><b>{fmtDate(v.nextDue)}</b></div>}
            </div>
          ))}
          {vax.length === 0 && <div className="text-center text-gray-400 py-6 text-sm">No vaccination records yet.</div>}
        </div>
      )}

      {tab === "weight" && (
        <div className="space-y-3">
          <details className="card p-4"><summary className="font-semibold cursor-pointer">+ Add weight</summary><div className="mt-3"><WeightForm goatId={goat.id} /></div></details>
          {lastWeight && (
            <div className="card p-3 text-sm flex justify-between">
              <div>Latest: <b>{lastWeight.weightKg} kg</b> ({fmtDate(lastWeight.date)})</div>
              {gain !== null && <div style={{ color: Number(gain) >= 0 ? "green" : "var(--red)" }}>{Number(gain) >= 0 ? "+" : ""}{gain} kg total</div>}
            </div>
          )}
          <div className="space-y-2">
            {[...weights].reverse().map((w) => (
              <div key={w.id} className="flex justify-between text-sm px-1"><span>{fmtDate(w.date)}</span><b>{w.weightKg} kg</b></div>
            ))}
          </div>
          {weights.length === 0 && <div className="text-center text-gray-400 py-6 text-sm">No weight records yet.</div>}
        </div>
      )}

      {tab === "repro" && repro && (
        <div className="card p-4 space-y-2 text-sm">
          <Row label="Total kiddings" value={repro.totalKiddings} />
          <Row label="Kids born" value={repro.totalBorn} />
          <Row label="Kids alive" value={repro.totalAlive} />
          <Row label="Avg kids/kidding" value={repro.avgKidsPerKidding.toFixed(2)} />
          <Row label="Twin rate" value={`${repro.twinRate.toFixed(1)}%`} />
          <Row label="Kid survival rate" value={`${repro.survivalRate.toFixed(1)}%`} />
          <Row label="Last kidding" value={fmtDate(repro.lastKiddingDate)} />
        </div>
      )}

      {tab === "money" && profitability && (
        <div className="card p-4 space-y-2 text-sm">
          <Row label="Purchase price" value={money(profitability.purchasePrice)} />
          <Row label="Health expenses" value={money(profitability.healthExpenses)} />
          <Row label="Other allocated expenses" value={money(profitability.otherExpenses)} />
          <Row label="Kids produced (alive)" value={profitability.kidsProduced} />
          <Row label="Kids sold — revenue" value={money(profitability.kidsSoldRevenue)} />
          <Row label="This goat's own sale value" value={money(profitability.ownSaleValue)} />
          <div className="flex justify-between pt-2 mt-1 border-t-2" style={{ borderColor: "var(--sand-deep)" }}>
            <span className="font-bold">Estimated contribution</span>
            <span className="font-extrabold" style={{ color: profitability.estimatedContribution >= 0 ? "var(--olive)" : "var(--red)" }}>
              {money(profitability.estimatedContribution)}
            </span>
          </div>
          <div className="text-xs text-gray-400 pt-2">{profitability.note}</div>
        </div>
      )}
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between border-b py-1.5" style={{ borderColor: "var(--sand)" }}>
    <span className="text-gray-500">{label}</span><span className="font-semibold text-right">{value}</span>
  </div>
);
