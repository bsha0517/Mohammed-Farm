"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkVaccinate } from "@/lib/actions/care";

type Opt = { id: string; name: string; tagId: string };

export default function BulkVaxForm({ goats }: { goats: Opt[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [f, setF] = useState({ vaccine: "", date: new Date().toISOString().slice(0, 10), nextDue: "", administeredBy: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.vaccine || selected.length === 0) return;
    setLoading(true);
    await bulkVaccinate({ goatIds: selected, ...f });
    setLoading(false);
    router.refresh();
    setSelected([]);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="field"><span>Vaccine name</span><input required value={f.vaccine} onChange={(e) => set("vaccine", e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Date given</span><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
        <label className="field"><span>Next due</span><input type="date" value={f.nextDue} onChange={(e) => set("nextDue", e.target.value)} /></label>
      </div>
      <div>
        <div className="text-xs font-semibold mb-1" style={{ color: "var(--olive-dark)" }}>Select goats ({selected.length} selected)</div>
        <div className="max-h-64 overflow-y-auto grid grid-cols-2 gap-2 p-2 rounded-xl" style={{ background: "var(--sand)" }}>
          {goats.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm bg-white rounded-lg px-2 py-1.5">
              <input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggle(g.id)} />
              {g.name} <span className="text-gray-400 text-xs">({g.tagId})</span>
            </label>
          ))}
        </div>
      </div>
      <button disabled={loading} className="btn btn-clay w-full">{loading ? "Saving…" : `Vaccinate ${selected.length} goat(s)`}</button>
    </form>
  );
}
