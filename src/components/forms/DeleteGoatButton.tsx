"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGoatPermanently } from "@/lib/actions/goats";

export default function DeleteGoatButton({ goatId, goatName }: { goatId: string; goatName: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Permanently delete ${goatName}? This cannot be undone. Only use this to correct a genuine mistake — for a real animal that died, was sold, or was culled, use those options instead so the history is kept.`)) return;
    setLoading(true);
    setError("");
    try {
      const result = await deleteGoatPermanently(goatId);
      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }
      router.push("/herd");
    } catch (err: any) {
      setError(err.message || "Couldn't delete this goat.");
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={loading} className="btn w-full" style={{ background: "transparent", color: "var(--red)", border: "1px solid var(--red)" }}>
        {loading ? "Deleting…" : "Permanently Delete This Goat"}
      </button>
      {error && <div className="text-xs mt-2" style={{ color: "var(--red)" }}>{error}</div>}
    </div>
  );
}
