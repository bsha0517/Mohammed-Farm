"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addFeedType, addFeedingRecord, ANIMAL_GROUPS } from "@/lib/actions/inventory";

type FeedTypeOpt = { id: string; name: string };

export default function FeedingForm({ feedTypes }: { feedTypes: FeedTypeOpt[] }) {
  const router = useRouter();
  const [newFeedName, setNewFeedName] = useState("");
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), feedTypeId: feedTypes[0]?.id || "", quantity: "", unit: "kg", animalGroup: ANIMAL_GROUPS[0], cost: "", notes: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const addFeed = async () => {
    if (!newFeedName.trim()) return;
    const ft = await addFeedType(newFeedName.trim());
    setNewFeedName("");
    set("feedTypeId", ft.id);
    router.refresh();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.feedTypeId || !f.quantity) return;
    setLoading(true);
    await addFeedingRecord({ ...f, quantity: Number(f.quantity), cost: f.cost ? Number(f.cost) : 0 });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input placeholder="New feed type (e.g. Berseem)" value={newFeedName} onChange={(e) => setNewFeedName(e.target.value)} />
        <button type="button" onClick={addFeed} className="btn btn-ghost whitespace-nowrap">+ Feed type</button>
      </div>
      <form onSubmit={submit} className="space-y-2">
        <label className="field"><span>Feed</span>
          <select required value={f.feedTypeId} onChange={(e) => set("feedTypeId", e.target.value)}>
            {feedTypes.length === 0 && <option value="">Add a feed type above first</option>}
            {feedTypes.map((ft) => <option key={ft.id} value={ft.id}>{ft.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="field"><span>Date</span><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
          <label className="field"><span>Animal group</span>
            <select value={f.animalGroup} onChange={(e) => set("animalGroup", e.target.value)}>
              {ANIMAL_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="field"><span>Quantity</span><input type="number" required value={f.quantity} onChange={(e) => set("quantity", e.target.value)} /></label>
          <label className="field"><span>Unit</span><input value={f.unit} onChange={(e) => set("unit", e.target.value)} /></label>
        </div>
        <label className="field"><span>Cost (Rs, optional)</span><input type="number" value={f.cost} onChange={(e) => set("cost", e.target.value)} /></label>
        <button disabled={loading || !f.feedTypeId} className="btn btn-primary w-full">{loading ? "Saving…" : "Log feeding"}</button>
      </form>
    </div>
  );
}
