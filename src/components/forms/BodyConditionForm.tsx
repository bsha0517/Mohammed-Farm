"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addBodyConditionRecord } from "@/lib/actions/care";

export default function BodyConditionForm({ goatId }: { goatId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), score: "3", notes: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addBodyConditionRecord({ goatId, date: f.date, score: Number(f.score), notes: f.notes });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Date</span><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
        <label className="field"><span>Score (1 = very thin, 5 = fat)</span>
          <select value={f.score} onChange={(e) => set("score", e.target.value)}>
            <option value="1">1 — Very thin</option>
            <option value="1.5">1.5</option>
            <option value="2">2 — Thin</option>
            <option value="2.5">2.5</option>
            <option value="3">3 — Ideal</option>
            <option value="3.5">3.5</option>
            <option value="4">4 — Fat</option>
            <option value="4.5">4.5</option>
            <option value="5">5 — Very fat</option>
          </select>
        </label>
      </div>
      <label className="field"><span>Notes</span><input value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Save score"}</button>
    </form>
  );
}
