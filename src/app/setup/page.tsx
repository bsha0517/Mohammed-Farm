"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { createFarmAndOwner } from "@/lib/actions/setup";

export default function SetupPage() {
  const router = useRouter();
  const [f, setF] = useState({ farmName: "8-4L Teddy Farm", location: "Okara, Punjab, Pakistan", currency: "PKR", ownerName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createFarmAndOwner(f);
      const res = await signIn("credentials", { email: f.email, password: f.password, redirect: false });
      if (res?.error) throw new Error("Account created — please sign in.");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "var(--sand)" }}>
      <form onSubmit={submit} className="w-full max-w-sm card p-5 space-y-3">
        <h1 className="text-lg font-bold mb-1" style={{ color: "var(--ink)" }}>Set up your farm</h1>
        <p className="text-xs text-gray-500 mb-3">This creates your farm and your Owner/Admin login. You only need to do this once.</p>
        <label className="field"><span>Farm name</span><input required value={f.farmName} onChange={(e) => set("farmName", e.target.value)} /></label>
        <label className="field"><span>Location</span><input value={f.location} onChange={(e) => set("location", e.target.value)} /></label>
        <label className="field"><span>Your name</span><input required value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} /></label>
        <label className="field"><span>Email</span><input type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
        <label className="field"><span>Password (min 8 characters)</span><input type="password" required minLength={8} value={f.password} onChange={(e) => set("password", e.target.value)} /></label>
        {error && <div className="text-sm font-semibold" style={{ color: "var(--red)" }}>{error}</div>}
        <button disabled={loading} className="btn btn-primary w-full" type="submit">{loading ? "Creating…" : "Create farm & sign in"}</button>
      </form>
    </div>
  );
}
