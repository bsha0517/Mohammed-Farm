"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordMortality } from "@/lib/actions/finance";

export default function MortalityForm({ goatId, onDone }: { goatId: string; onDone?: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({ dateOfDeath: new Date().toISOString().slice(0, 10), ageAtDeath: "", suspectedCause: "", confirmedCause: "", vetDiagnosis: "", notes: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Mark this goat as deceased? This changes its status permanently (though the record itself is always kept).")) return;
    setLoading(true);
    setError("");
    try {
      await recordMortality({ goatId, ...f });
      router.refresh();
      onDone?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Date of death</span><input type="date" value={f.dateOfDeath} onChange={(e) => set("dateOfDeath", e.target.value)} /></label>
        <label className="field"><span>Age at death (optional)</span><input value={f.ageAtDeath} onChange={(e) => set("ageAtDeath", e.target.value)} placeholder="e.g. 2 yr 3 mo" /></label>
      </div>
      <label className="field"><span>Suspected cause</span><input value={f.suspectedCause} onChange={(e) => set("suspectedCause", e.target.value)} /></label>
      <label className="field"><span>Confirmed cause (if known)</span><input value={f.confirmedCause} onChange={(e) => set("confirmedCause", e.target.value)} /></label>
      <label className="field"><span>Veterinary diagnosis</span><input value={f.vetDiagnosis} onChange={(e) => set("vetDiagnosis", e.target.value)} /></label>
      <label className="field"><span>Notes</span><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      {error && <div className="text-sm font-semibold" style={{ color: "var(--red)" }}>{error}</div>}
      <button disabled={loading} className="btn w-full" style={{ background: "var(--red)", color: "white" }}>{loading ? "Saving…" : "Mark as Deceased"}</button>
    </form>
  );
}
