"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBreedingRecord, previewInbreedingWarning } from "@/lib/actions/breeding";

type Opt = { id: string; name: string };

export default function BreedingForm({ females, males }: { females: Opt[]; males: Opt[] }) {
  const router = useRouter();
  const [f, setF] = useState({ femaleId: "", maleId: "", heatDate: "", matingDate: new Date().toISOString().slice(0, 10), method: "NATURAL", attempts: 1, expectedKidding: "", notes: "" });
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (f.matingDate) {
      const d = new Date(f.matingDate);
      d.setDate(d.getDate() + 150);
      set("expectedKidding", d.toISOString().slice(0, 10));
    }
    // eslint-disable-next-line
  }, [f.matingDate]);

  useEffect(() => {
    let active = true;
    if (f.maleId && f.femaleId) {
      previewInbreedingWarning(f.maleId, f.femaleId).then((w) => active && setWarning(w));
    } else setWarning(null);
    return () => { active = false; };
  }, [f.maleId, f.femaleId]);

  const submit = async (e: React.FormEvent, override = false) => {
    e.preventDefault();
    if (!f.femaleId || !f.maleId) { setError("Select both female and male."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await createBreedingRecord({ ...f, method: f.method as any, overrideWarning: override } as any);
      if ((res as any).warning && !override) {
        setWarning((res as any).warning);
        setLoading(false);
        return;
      }
      router.push("/breeding");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => submit(e, false)} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Female</span>
          <select required value={f.femaleId} onChange={(e) => set("femaleId", e.target.value)}>
            <option value="">Select…</option>{females.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Male</span>
          <select required value={f.maleId} onChange={(e) => set("maleId", e.target.value)}>
            <option value="">Select…</option>{males.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
      </div>
      {warning && (
        <div className="p-3 rounded-lg text-xs font-semibold" style={{ background: "#FCE8E6", color: "var(--red)" }}>
          {warning}
          <button type="button" onClick={(e: any) => submit(e, true)} className="block mt-2 underline">Record anyway</button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Heat observed</span><input type="date" value={f.heatDate} onChange={(e) => set("heatDate", e.target.value)} /></label>
        <label className="field"><span>Mating date</span><input type="date" value={f.matingDate} onChange={(e) => set("matingDate", e.target.value)} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Method</span>
          <select value={f.method} onChange={(e) => set("method", e.target.value)}><option value="NATURAL">Natural</option><option value="AI">Artificial Insemination</option></select>
        </label>
        <label className="field"><span>Attempts</span><input type="number" value={f.attempts} onChange={(e) => set("attempts", e.target.value)} /></label>
      </div>
      <label className="field"><span>Expected kidding date</span><input type="date" value={f.expectedKidding} onChange={(e) => set("expectedKidding", e.target.value)} /></label>
      <label className="field"><span>Notes</span><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      {error && <div className="text-sm font-semibold" style={{ color: "var(--red)" }}>{error}</div>}
      <button disabled={loading} className="btn btn-primary w-full" type="submit">{loading ? "Saving…" : "Record mating"}</button>
    </form>
  );
}
