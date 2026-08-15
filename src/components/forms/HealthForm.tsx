"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addHealthRecord } from "@/lib/actions/care";

export default function HealthForm({ goatId }: { goatId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), symptoms: "", diagnosis: "", temperature: "", veterinarian: "", treatment: "", medicine: "", dose: "", duration: "", cost: "", notes: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addHealthRecord({ goatId, ...f, cost: Number(f.cost) || 0 });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="field"><span>Date</span><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
      <label className="field"><span>Symptoms</span><input value={f.symptoms} onChange={(e) => set("symptoms", e.target.value)} /></label>
      <label className="field"><span>Diagnosis</span><input value={f.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Temperature</span><input value={f.temperature} onChange={(e) => set("temperature", e.target.value)} /></label>
        <label className="field"><span>Veterinarian</span><input value={f.veterinarian} onChange={(e) => set("veterinarian", e.target.value)} /></label>
      </div>
      <label className="field"><span>Treatment</span><input value={f.treatment} onChange={(e) => set("treatment", e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Medicine</span><input value={f.medicine} onChange={(e) => set("medicine", e.target.value)} /></label>
        <label className="field"><span>Dose</span><input value={f.dose} onChange={(e) => set("dose", e.target.value)} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Duration</span><input value={f.duration} onChange={(e) => set("duration", e.target.value)} /></label>
        <label className="field"><span>Cost (Rs)</span><input type="number" value={f.cost} onChange={(e) => set("cost", e.target.value)} /></label>
      </div>
      <label className="field"><span>Notes</span><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Save record"}</button>
    </form>
  );
}
