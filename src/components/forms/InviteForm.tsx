"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteTeamMember } from "@/lib/actions/setup";

export default function InviteForm({ farmId }: { farmId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", role: "WORKER" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await inviteTeamMember({ farmId, name: f.name, email: f.email, password: f.password, role: f.role as any });
      setSuccess(`Account created for ${f.name}. Share these credentials with them directly — there's no email invite yet, so write the password down now.`);
      setF({ name: "", email: "", password: "", role: "WORKER" });
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="field"><span>Name</span><input required value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
      <label className="field"><span>Email</span><input type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
      <label className="field"><span>Password (min 8 characters)</span><input type="password" required minLength={8} value={f.password} onChange={(e) => set("password", e.target.value)} /></label>
      <label className="field"><span>Role</span>
        <select value={f.role} onChange={(e) => set("role", e.target.value)}>
          <option value="WORKER">Farm Worker — feeding, weight, health notes, tasks</option>
          <option value="VET">Veterinarian — health, treatments, vaccinations, pregnancy</option>
        </select>
      </label>
      {error && <div className="text-sm font-semibold" style={{ color: "var(--red)" }}>{error}</div>}
      {success && <div className="text-sm font-semibold p-3 rounded-lg" style={{ background: "#E8EFE3", color: "var(--olive-dark)" }}>{success}</div>}
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "Creating…" : "Create account"}</button>
    </form>
  );
}
