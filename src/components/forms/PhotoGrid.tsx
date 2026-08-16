"use client";
import { useRouter } from "next/navigation";
import { setPrimaryPhoto, deleteGoatPhoto } from "@/lib/actions/uploads";

type Photo = { id: string; url: string; isPrimary: boolean };

export default function PhotoGrid({ goatId, photos }: { goatId: string; photos: Photo[] }) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((p) => (
        <div key={p.id} className="relative">
          <img src={p.url} alt="" className="w-full aspect-square object-cover rounded-lg" />
          {p.isPrimary && (
            <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--olive)", color: "white" }}>Main</span>
          )}
          <div className="flex gap-1 mt-1">
            {!p.isPrimary && (
              <button onClick={async () => { await setPrimaryPhoto(p.id, goatId); router.refresh(); }} className="text-[10px] font-semibold" style={{ color: "var(--olive-dark)" }}>
                Set main
              </button>
            )}
            <button onClick={async () => { if (confirm("Delete this photo?")) { await deleteGoatPhoto(p.id, goatId); router.refresh(); } }} className="text-[10px] font-semibold ml-auto" style={{ color: "var(--red)" }}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
