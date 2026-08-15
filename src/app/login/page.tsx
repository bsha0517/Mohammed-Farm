"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Incorrect email or password.");
    else router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--sand)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐐</div>
          <h1 className="text-xl font-bold" style={{ color: "var(--ink)" }}>8-4L Teddy Farm</h1>
          <p className="text-sm text-gray-500">Goat Management</p>
        </div>
        <form onSubmit={submit} className="card p-5 space-y-3">
          <label className="field">
            <span>Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="text-sm font-semibold" style={{ color: "var(--red)" }}>{error}</div>}
          <button disabled={loading} className="btn btn-primary w-full" type="submit">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          First time setting up this farm? <Link href="/setup" className="font-semibold underline">Create farm account</Link>
        </p>
      </div>
    </div>
  );
}
