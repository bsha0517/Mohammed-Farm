"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadGoatPhoto } from "@/lib/actions/uploads";

export default function PhotoUploadForm({ goatId, hasPhotos }: { goatId: string; hasPhotos: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("goatId", goatId);
      formData.append("file", file);
      formData.append("makePrimary", String(!hasPhotos));
      await uploadGoatPhoto(formData);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={loading}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-sm"
      />
      {loading && <div className="text-xs text-gray-500 mt-1">Uploading…</div>}
      {error && <div className="text-xs mt-1" style={{ color: "var(--red)" }}>{error}</div>}
    </div>
  );
}
