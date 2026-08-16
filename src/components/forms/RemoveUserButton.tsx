"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeTeamMember } from "@/lib/actions/setup";

export default function RemoveUserButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const remove = async () => {
    setLoading(true);
    setError("");
    try {
      await removeTeamMember(userId);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Couldn't remove this account.");
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Remove {userName}?</span>
        <button onClick={remove} disabled={loading} className="text-xs font-bold" style={{ color: "var(--red)" }}>
          {loading ? "…" : "Yes"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs font-semibold text-gray-400">Cancel</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setConfirming(true)} className="text-xs font-semibold" style={{ color: "var(--red)" }}>
        Remove
      </button>
      {error && <div className="text-[10px] mt-0.5" style={{ color: "var(--red)" }}>{error}</div>}
    </div>
  );
}
