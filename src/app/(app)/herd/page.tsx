import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { ageString } from "@/lib/utils";
import Link from "next/link";

const statusBg: Record<string, string> = {
  PREGNANT: "#F5E1D8", LACTATING: "#F7EBCE", DEAD: "#F7DFDD", SOLD: "#EEEAE0", CULLED: "#EEEAE0", FOR_SALE: "#F7EBCE",
};
const statusFg: Record<string, string> = {
  PREGNANT: "#B5502B", LACTATING: "#8A6A1E", DEAD: "#B3261E", SOLD: "#6B6252", CULLED: "#6B6252", FOR_SALE: "#8A6A1E",
};

export default async function HerdPage({ searchParams }: { searchParams: { q?: string } }) {
  const { farmId } = await requireFarmSession();
  const q = (searchParams.q || "").toLowerCase().trim();

  const goats = await prisma.goat.findMany({ where: { farmId }, orderBy: { createdAt: "desc" } });
  const byId = new Map(goats.map((g) => [g.id, g]));

  const filtered = q
    ? goats.filter((g) => {
        const mother = g.motherId ? byId.get(g.motherId)?.name : "";
        const father = g.fatherId ? byId.get(g.fatherId)?.name : "";
        return [g.tagId, g.name, g.sex, g.status, g.breed, mother, father].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      })
    : goats;

  return (
    <div className="space-y-3">
      <form className="flex gap-2" action="/herd">
        <input name="q" defaultValue={searchParams.q || ""} placeholder="Search by name, ID, mother, father, status…" />
        <Link href="/herd/new" className="btn btn-primary whitespace-nowrap">+ Goat</Link>
      </form>
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((g) => (
          <Link key={g.id} href={`/herd/${g.id}`} className="card p-3">
            <div className="w-full aspect-square rounded-xl mb-2 flex items-center justify-center text-4xl" style={{ background: "var(--sand-deep)" }}>
              {g.sex === "MALE" ? "🐐" : "🐏"}
            </div>
            <div className="font-bold">{g.name}</div>
            <div className="text-xs text-gray-500 mb-1">{g.tagId} · {ageString(g.dob)}</div>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: statusBg[g.status] || "#E8EFE3", color: statusFg[g.status] || "#374F2A" }}>
              {g.status.replace("_", " ")}
            </span>
          </Link>
        ))}
        {filtered.length === 0 && <div className="col-span-2 text-center text-gray-400 py-10">No goats match your search.</div>}
      </div>
    </div>
  );
}
