"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addExpense } from "@/lib/actions/finance";

const CATS = ["Goat purchase", "Feed", "Veterinary", "Medicines", "Vaccination", "Labour", "Shed", "Equipment", "Transportation", "Electricity", "Water", "Breeding", "Miscellaneous"];

export default function ExpenseForm({ goats }: { goats: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), category: CATS[0], description: "", amount: "", goatId: "", paymentMethod: "Cash" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.amount) return;
    setLoading(true);
    await addExpense({ ...f, amount: Number(f.amount), goatId: f.goatId || null });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Date</span><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
        <label className="field"><span>Category</span><select value={f.category} onChange={(e) => set("category", e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <label className="field"><span>Description</span><input value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Amount (Rs)</span><input type="number" required value={f.amount} onChange={(e) => set("amount", e.target.value)} /></label>
        <label className="field"><span>Payment</span><select value={f.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}><option>Cash</option><option>Bank Transfer</option><option>Other</option></select></label>
      </div>
      <label className="field"><span>Related goat (optional)</span>
        <select value={f.goatId} onChange={(e) => set("goatId", e.target.value)}>
          <option value="">Whole-farm expense</option>{goats.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </label>
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Save expense"}</button>
    </form>
  );
}
