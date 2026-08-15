"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordSale } from "@/lib/actions/finance";

export default function SaleForm({ goats }: { goats: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ goatId: "", buyer: "", buyerPhone: "", saleDate: new Date().toISOString().slice(0, 10), price: "", weightKg: "", purpose: "MEAT" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.goatId || !f.price) return;
    setLoading(true);
    await recordSale({ ...f, price: Number(f.price), weightKg: f.weightKg ? Number(f.weightKg) : undefined, purpose: f.purpose as any });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="field"><span>Goat</span>
        <select required value={f.goatId} onChange={(e) => set("goatId", e.target.value)}>
          <option value="">Select…</option>{goats.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Buyer</span><input value={f.buyer} onChange={(e) => set("buyer", e.target.value)} /></label>
        <label className="field"><span>Buyer phone</span><input value={f.buyerPhone} onChange={(e) => set("buyerPhone", e.target.value)} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Sale date</span><input type="date" value={f.saleDate} onChange={(e) => set("saleDate", e.target.value)} /></label>
        <label className="field"><span>Price (Rs)</span><input type="number" required value={f.price} onChange={(e) => set("price", e.target.value)} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Weight (kg)</span><input type="number" value={f.weightKg} onChange={(e) => set("weightKg", e.target.value)} /></label>
        <label className="field"><span>Purpose</span><select value={f.purpose} onChange={(e) => set("purpose", e.target.value)}><option value="MEAT">Meat</option><option value="BREEDING">Breeding</option><option value="EID">Eid</option><option value="CULL">Cull</option><option value="OTHER">Other</option></select></label>
      </div>
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Save sale"}</button>
    </form>
  );
}
