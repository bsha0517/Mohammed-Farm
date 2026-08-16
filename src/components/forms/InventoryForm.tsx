"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addInventoryItem } from "@/lib/actions/inventory";

const CATEGORIES = ["Feed", "Minerals", "Medicines", "Vaccines", "Ear tags", "Syringes", "Bedding", "Disinfectant", "Other"];

export default function InventoryForm() {
  const router = useRouter();
  const [f, setF] = useState({ item: "", category: CATEGORIES[0], quantity: "", unit: "kg", purchaseDate: "", cost: "", supplier: "", expiryDate: "", minimumStockLevel: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.item || !f.quantity) return;
    setLoading(true);
    await addInventoryItem({
      item: f.item, category: f.category, quantity: Number(f.quantity), unit: f.unit,
      purchaseDate: f.purchaseDate || undefined, cost: f.cost ? Number(f.cost) : undefined,
      supplier: f.supplier || undefined, expiryDate: f.expiryDate || undefined,
      minimumStockLevel: f.minimumStockLevel ? Number(f.minimumStockLevel) : undefined,
    });
    setLoading(false);
    setF({ item: "", category: CATEGORIES[0], quantity: "", unit: "kg", purchaseDate: "", cost: "", supplier: "", expiryDate: "", minimumStockLevel: "" });
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="field"><span>Item name</span><input required value={f.item} onChange={(e) => set("item", e.target.value)} placeholder="e.g. PPR Vaccine, Ivermectin" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Category</span><select value={f.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="field"><span>Unit</span><input value={f.unit} onChange={(e) => set("unit", e.target.value)} placeholder="kg, bags, bottles…" /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Quantity</span><input type="number" required value={f.quantity} onChange={(e) => set("quantity", e.target.value)} /></label>
        <label className="field"><span>Minimum stock level</span><input type="number" value={f.minimumStockLevel} onChange={(e) => set("minimumStockLevel", e.target.value)} placeholder="Alert below this" /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Purchase date</span><input type="date" value={f.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} /></label>
        <label className="field"><span>Cost (Rs)</span><input type="number" value={f.cost} onChange={(e) => set("cost", e.target.value)} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Supplier</span><input value={f.supplier} onChange={(e) => set("supplier", e.target.value)} /></label>
        <label className="field"><span>Expiry date</span><input type="date" value={f.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} /></label>
      </div>
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Add item"}</button>
    </form>
  );
}
