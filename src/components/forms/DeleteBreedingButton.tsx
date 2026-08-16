"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBreedingRecord } from "@/lib/actions/breeding";

export default function DeleteBreedingButton({ breedingId }: { breedingId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Permanently delete this mating record? This cannot be undone.")) return;
    setLoading(true);
    setError("");
    try {
      await deleteBreedingRecord(breedingId);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Couldn't delete this record.");
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={loading} className="text-xs font-semibold" style={{ color: "var(--red)" }}>
        {loading ? "Deleting…" : "Delete record"}
      </button>
      {error && <div className="text-[11px] mt-1" style={{ color: "var(--red)" }}>{error}</div>}
    </div>
  );
}
