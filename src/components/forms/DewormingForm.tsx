"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDeworming } from "@/lib/actions/care";

export default function DewormingForm({ goatId }: { goatId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), dewormer: "", activeIngredient: "", dose: "", weightAtTreatment: "", reason: "", nextReview: "", notes: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.dewormer) return;
    setLoading(true);
    await addDeworming({ goatId, ...f, weightAtTreatment: f.weightAtTreatment ? Number(f.weightAtTreatment) : undefined });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="field"><span>Dewormer</span><input required value={f.dewormer} onChange={(e) => set("dewormer", e.target.value)} placeholder="e.g. Albendazole" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Date</span><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
        <label className="field"><span>Active ingredient</span><input value={f.activeIngredient} onChange={(e) => set("activeIngredient", e.target.value)} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Dose</span><input value={f.dose} onChange={(e) => set("dose", e.target.value)} /></label>
        <label className="field"><span>Weight at treatment (kg)</span><input type="number" value={f.weightAtTreatment} onChange={(e) => set("weightAtTreatment", e.target.value)} /></label>
      </div>
      <label className="field"><span>Reason</span><input value={f.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Routine, symptoms observed…" /></label>
      <label className="field"><span>Next review date</span><input type="date" value={f.nextReview} onChange={(e) => set("nextReview", e.target.value)} /></label>
      <label className="field"><span>Notes</span><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Save deworming record"}</button>
    </form>
  );
}
