"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePregnancyStatus } from "@/lib/actions/breeding";

const OPTIONS = ["MATED", "NOT_CONFIRMED", "PREGNANT", "NOT_PREGNANT", "ABORTED", "KIDDED"];

export default function PregStatusForm({ breedingId, current }: { breedingId: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [confirmedDate, setConfirmedDate] = useState("");
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updatePregnancyStatus(breedingId, status as any, { pregConfirmedDate: confirmedDate || undefined, pregConfirmMethod: method || undefined });
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="field"><span>Pregnancy status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </label>
      {status === "PREGNANT" && (
        <div className="grid grid-cols-2 gap-2">
          <label className="field"><span>Confirmed date</span><input type="date" value={confirmedDate} onChange={(e) => setConfirmedDate(e.target.value)} /></label>
          <label className="field"><span>Method</span><input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="e.g. Palpation" /></label>
        </div>
      )}
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Update status"}</button>
    </form>
  );
}
