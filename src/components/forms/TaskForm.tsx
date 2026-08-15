"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addTask } from "@/lib/actions/finance";

export default function TaskForm({ goats }: { goats: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ title: "", category: "General", dueDate: new Date().toISOString().slice(0, 10), goatId: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title) return;
    setLoading(true);
    await addTask({ ...f, goatId: f.goatId || null });
    setLoading(false);
    setF({ title: "", category: "General", dueDate: new Date().toISOString().slice(0, 10), goatId: "" });
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="field"><span>Title</span><input required value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Deworm Sultan" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Category</span>
          <select value={f.category} onChange={(e) => set("category", e.target.value)}>
            <option>General</option><option>Vaccination</option><option>Pregnancy check</option><option>Weight check</option><option>Medicine</option><option>Breeding</option><option>Inventory</option>
          </select>
        </label>
        <label className="field"><span>Due date</span><input type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></label>
      </div>
      <label className="field"><span>Related goat (optional)</span>
        <select value={f.goatId} onChange={(e) => set("goatId", e.target.value)}>
          <option value="">None</option>{goats.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </label>
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Save task"}</button>
    </form>
  );
}
