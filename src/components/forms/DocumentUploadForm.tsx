"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/actions/uploads";

const DOC_TYPES = [
  { value: "prescription", label: "Prescription" },
  { value: "receipt", label: "Receipt" },
  { value: "lab_report", label: "Lab report" },
  { value: "other", label: "Other" },
];

export default function DocumentUploadForm({ goatId }: { goatId: string }) {
  const router = useRouter();
  const [type, setType] = useState("prescription");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      await uploadDocument({ goatId, type, label, file });
      setFile(null);
      setLabel("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="field"><span>Type</span><select value={type} onChange={(e) => setType(e.target.value)}>{DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
        <label className="field"><span>Label (optional)</span><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Vet visit 12 Jun" /></label>
      </div>
      <label className="field"><span>File (image or PDF)</span>
        <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
      </label>
      {error && <div className="text-xs" style={{ color: "var(--red)" }}>{error}</div>}
      <button disabled={loading || !file} className="btn btn-primary w-full">{loading ? "Uploading…" : "Upload document"}</button>
    </form>
  );
}
