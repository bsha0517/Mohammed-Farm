"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addWeightRecord } from "@/lib/actions/care";

export default function WeightForm({ goatId }: { goatId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), weightKg: "", notes: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.weightKg) return;
    setLoading(true);
    await addWeightRecord({ goatId, date: f.date, weightKg: Number(f.weightKg), notes: f.notes });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Date</span><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
        <label className="field"><span>Weight (kg)</span><input type="number" step="0.1" required value={f.weightKg} onChange={(e) => set("weightKg", e.target.value)} /></label>
      </div>
      <label className="field"><span>Notes</span><input value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Save"}</button>
    </form>
  );
}
