"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCulling } from "@/lib/actions/finance";

const REASONS = ["Poor fertility", "Poor mothering", "Repeated disease", "Low kid survival", "Physical defect", "Slow growth", "Age", "Genetic issue", "Other"];

export default function CullingForm({ goatId, onDone }: { goatId: string; onDone?: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), reason: REASONS[0], notes: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Cull this goat from breeding? This changes its status permanently (the record itself is always kept).")) return;
    setLoading(true);
    setError("");
    try {
      await recordCulling({ goatId, ...f });
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
        <label className="field"><span>Date</span><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
        <label className="field"><span>Reason</span><select value={f.reason} onChange={(e) => set("reason", e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>
      </div>
      <label className="field"><span>Notes</span><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      {error && <div className="text-sm font-semibold" style={{ color: "var(--red)" }}>{error}</div>}
      <button disabled={loading} className="btn w-full" style={{ background: "var(--clay)", color: "white" }}>{loading ? "Saving…" : "Cull This Goat"}</button>
    </form>
  );
}
