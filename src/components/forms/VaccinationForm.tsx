"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addVaccination } from "@/lib/actions/care";

export default function VaccinationForm({ goatId }: { goatId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ vaccine: "", date: new Date().toISOString().slice(0, 10), dose: "", batchNumber: "", administeredBy: "", nextDue: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.vaccine) return;
    setLoading(true);
    await addVaccination({ goatId, ...f });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="field"><span>Vaccine name</span><input required value={f.vaccine} onChange={(e) => set("vaccine", e.target.value)} placeholder="e.g. PPR" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Date given</span><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
        <label className="field"><span>Next due</span><input type="date" value={f.nextDue} onChange={(e) => set("nextDue", e.target.value)} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Dose</span><input value={f.dose} onChange={(e) => set("dose", e.target.value)} /></label>
        <label className="field"><span>Batch number</span><input value={f.batchNumber} onChange={(e) => set("batchNumber", e.target.value)} /></label>
      </div>
      <label className="field"><span>Administered by</span><input value={f.administeredBy} onChange={(e) => set("administeredBy", e.target.value)} /></label>
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Save"}</button>
    </form>
  );
}
