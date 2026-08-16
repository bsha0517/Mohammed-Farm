import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { fmtDate, daysBetween, todayISO } from "@/lib/utils";
import Link from "next/link";
import PregStatusForm from "@/components/forms/PregStatusForm";

export default async function BreedingPage() {
  const { farmId } = await requireFarmSession();
  const records = await prisma.breedingRecord.findMany({
    where: { farmId },
    include: { female: true, male: true, kidding: true },
    orderBy: { matingDate: "desc" },
  });

  return (
    <div className="space-y-3">
      <Link href="/breeding/new" className="btn btn-primary block text-center">+ Record Mating</Link>
      {records.map((b) => {
        const days = b.expectedKidding ? daysBetween(todayISO(), b.expectedKidding) : null;
        return (
          <div key={b.id} className="card p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold">{b.female.name} × {b.male.name}</div>
                <div className="text-xs text-gray-500">Mated {fmtDate(b.matingDate)} · {b.method === "AI" ? "Artificial Insemination" : "Natural"}</div>
                {b.expectedKidding && <div className="text-xs text-gray-500">Expected kidding: {fmtDate(b.expectedKidding)} {days !== null && `(${days}d)`}</div>}
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: b.pregStatus === "PREGNANT" ? "#F5E1D8" : b.pregStatus === "KIDDED" ? "#E8EFE3" : "#F7EBCE", color: b.pregStatus === "PREGNANT" ? "var(--clay)" : b.pregStatus === "KIDDED" ? "var(--olive-dark)" : "#8A6A1E" }}>
                {b.pregStatus.replace("_", " ")}
              </span>
            </div>
            <details className="mt-2"><summary className="text-xs font-semibold cursor-pointer" style={{ color: "var(--olive-dark)" }}>Update status</summary>
              <div className="mt-2"><PregStatusForm breedingId={b.id} current={b.pregStatus} /></div>
            </details>
            {Array.isArray(b.statusHistory) && (b.statusHistory as any[]).length > 0 && (
              <details className="mt-1"><summary className="text-xs font-semibold cursor-pointer text-gray-400">History</summary>
                <div className="mt-1 space-y-0.5">
                  {(b.statusHistory as any[]).map((h, i) => (
                    <div key={i} className="text-[11px] text-gray-400">{fmtDate(h.date)} — {String(h.status).replace("_", " ")}</div>
                  ))}
                </div>
              </details>
            )}
            {!b.kidding && b.pregStatus !== "KIDDED" && (
              <Link href={`/breeding/${b.id}/kid`} className="text-xs font-semibold mt-2 inline-block" style={{ color: "var(--clay)" }}>Record kidding →</Link>
            )}
          </div>
        );
      })}
      {records.length === 0 && <div className="text-center text-gray-400 py-10">No matings recorded yet.</div>}
    </div>
  );
}
