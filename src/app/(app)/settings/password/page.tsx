"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changeOwnPassword } from "@/lib/actions/setup";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setError("New passwords don't match."); return; }
    setLoading(true);
    setError("");
    try {
      await changeOwnPassword(current, next);
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Link href="/settings" className="text-sm font-semibold" style={{ color: "var(--olive-dark)" }}>← Back to Settings</Link>
      <form onSubmit={submit} className="card p-4 space-y-2">
        <div className="font-bold text-sm mb-1" style={{ color: "var(--olive-dark)" }}>Change Password</div>
        <label className="field"><span>Current password</span><input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} /></label>
        <label className="field"><span>New password (min 8 characters)</span><input type="password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} /></label>
        <label className="field"><span>Confirm new password</span><input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
        {error && <div className="text-sm font-semibold" style={{ color: "var(--red)" }}>{error}</div>}
        {success && <div className="text-sm font-semibold p-2 rounded-lg" style={{ background: "#E8EFE3", color: "var(--olive-dark)" }}>Password updated.</div>}
        <button disabled={loading} className="btn btn-primary w-full">{loading ? "Saving…" : "Update password"}</button>
      </form>
    </div>
  );
}
