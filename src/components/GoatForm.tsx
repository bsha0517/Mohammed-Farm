"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGoat, updateGoat, GoatFormInput } from "@/lib/actions/goats";

type GoatOption = { id: string; name: string; sex: "MALE" | "FEMALE" };

const STATUS_OPTIONS = ["ACTIVE", "KID", "BREEDING", "PREGNANT", "LACTATING", "FOR_SALE", "SOLD", "DEAD", "CULLED"];

export default function GoatForm({ initial, mothers, fathers }: { initial?: any; mothers: GoatOption[]; fathers: GoatOption[] }) {
  const router = useRouter();
  const [f, setF] = useState<GoatFormInput>(
    initial
      ? {
          id: initial.id,
          name: initial.name,
          sex: initial.sex,
          breed: initial.breed,
          dob: initial.dob.toISOString().slice(0, 10),
          color: initial.color || "",
          earTag: initial.earTag || "",
          status: initial.status,
          origin: initial.origin,
          motherId: initial.motherId,
          fatherId: initial.fatherId,
          purchaseDate: initial.purchaseDate ? initial.purchaseDate.toISOString().slice(0, 10) : "",
          purchasePrice: initial.purchasePrice,
          seller: initial.seller || "",
          notes: initial.notes || "",
        }
      : { name: "", sex: "FEMALE" as any, breed: "Teddy", dob: "", color: "", earTag: "", status: "ACTIVE" as any, origin: "BORN_ON_FARM" as any, motherId: "", fatherId: "", notes: "" }
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: keyof GoatFormInput, v: any) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.dob) { setError("Name and date of birth are required."); return; }
    setLoading(true);
    setError("");
    try {
      const payload = { ...f, motherId: f.motherId || null, fatherId: f.fatherId || null };
      const goat = initial ? await updateGoat(payload) : await createGoat(payload);
      router.push(`/herd/${goat.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="field"><span>Name</span><input required value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field"><span>Sex</span>
          <select value={f.sex} onChange={(e) => set("sex", e.target.value)} disabled={!!initial}>
            <option value="FEMALE">Female</option><option value="MALE">Male</option>
          </select>
        </label>
        <label className="field"><span>Breed</span><input value={f.breed} onChange={(e) => set("breed", e.target.value)} /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="field"><span>Date of birth</span><input type="date" required value={f.dob} onChange={(e) => set("dob", e.target.value)} /></label>
        <label className="field"><span>Status</span>
          <select value={f.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="field"><span>Color / marks</span><input value={f.color} onChange={(e) => set("color", e.target.value)} /></label>
        <label className="field"><span>Ear tag</span><input value={f.earTag} onChange={(e) => set("earTag", e.target.value)} /></label>
      </div>
      <label className="field"><span>Mother</span>
        <select value={f.motherId || ""} onChange={(e) => set("motherId", e.target.value)}>
          <option value="">Unknown / none</option>
          {mothers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
      <label className="field"><span>Father</span>
        <select value={f.fatherId || ""} onChange={(e) => set("fatherId", e.target.value)}>
          <option value="">Unknown / none</option>
          {fathers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
      <label className="field"><span>Origin</span>
        <select value={f.origin} onChange={(e) => set("origin", e.target.value)}>
          <option value="BORN_ON_FARM">Born on farm</option><option value="PURCHASED">Purchased</option>
        </select>
      </label>
      {f.origin === "PURCHASED" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="field"><span>Purchase date</span><input type="date" value={f.purchaseDate || ""} onChange={(e) => set("purchaseDate", e.target.value)} /></label>
          <label className="field"><span>Purchase price (Rs)</span><input type="number" value={f.purchasePrice || ""} onChange={(e) => set("purchasePrice", Number(e.target.value))} /></label>
        </div>
      )}
      <label className="field"><span>Notes</span><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      {error && <div className="text-sm font-semibold" style={{ color: "var(--red)" }}>{error}</div>}
      <button disabled={loading} className="btn btn-primary w-full" type="submit">{loading ? "Saving…" : initial ? "Save changes" : "Add goat"}</button>
    </form>
  );
}
