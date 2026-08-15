"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordKidding } from "@/lib/actions/kidding";

export default function KiddingForm({ breedingId, motherId, fatherId, motherName, fatherName }: { breedingId: string; motherId: string; fatherId: string | null; motherName: string; fatherName: string }) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [kids, setKids] = useState([{ name: "", sex: "FEMALE", alive: true }]);
  const [complications, setComplications] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const syncCount = (n: number) => {
    n = Math.max(1, n);
    setKids((prev) => {
      const arr = [...prev];
      while (arr.length < n) arr.push({ name: "", sex: "FEMALE", alive: true });
      return arr.slice(0, n);
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await recordKidding({
      breedingRecordId: breedingId,
      motherId, fatherId,
      kiddingDate: date,
      complications, notes,
      kids: kids.map((k) => ({ name: k.name, sex: k.sex as any, alive: k.alive })),
    });
    router.push("/breeding");
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="text-sm text-gray-500">Mother: <b>{motherName}</b> · Father: <b>{fatherName}</b></div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Kidding date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field"><span>Total kids born</span><input type="number" min={1} value={kids.length} onChange={(e) => syncCount(Number(e.target.value))} /></label>
      </div>
      <div className="space-y-2">
        {kids.map((k, i) => (
          <div key={i} className="flex gap-2 items-center p-2 rounded-xl" style={{ background: "var(--sand)" }}>
            <span className="text-xs font-semibold w-12">Kid {i + 1}</span>
            <input placeholder="Name (optional)" className="flex-1" value={k.name} onChange={(e) => setKids((a) => a.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)))} />
            <select style={{ width: 100 }} value={k.sex} onChange={(e) => setKids((a) => a.map((x, xi) => (xi === i ? { ...x, sex: e.target.value } : x)))}>
              <option value="FEMALE">Female</option><option value="MALE">Male</option>
            </select>
            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
              <input type="checkbox" checked={k.alive} onChange={(e) => setKids((a) => a.map((x, xi) => (xi === i ? { ...x, alive: e.target.checked } : x)))} /> Alive
            </label>
          </div>
        ))}
      </div>
      <label className="field"><span>Complications (if any)</span><input value={complications} onChange={(e) => setComplications(e.target.value)} /></label>
      <label className="field"><span>Notes</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      <div className="text-xs text-gray-500">Saving creates a goat profile for each kid, linked to {motherName} and {fatherName} in the pedigree.</div>
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Save kidding & create kids"}</button>
    </form>
  );
}
