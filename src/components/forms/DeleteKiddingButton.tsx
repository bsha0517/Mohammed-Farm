"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteKiddingRecord } from "@/lib/actions/kidding";

export default function DeleteKiddingButton({ kiddingId }: { kiddingId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Permanently delete this kidding record? This cannot be undone.")) return;
    setLoading(true);
    setError("");
    const result = await deleteKiddingRecord(kiddingId);
    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={loading} className="text-xs font-semibold" style={{ color: "var(--red)" }}>
        {loading ? "Deleting…" : "Delete kidding record"}
      </button>
      {error && <div className="text-[11px] mt-1" style={{ color: "var(--red)" }}>{error}</div>}
    </div>
  );
}
