import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import InviteForm from "@/components/forms/InviteForm";
import { fmtDate } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = { OWNER: "Owner / Admin", WORKER: "Farm Worker", VET: "Veterinarian" };

export default async function TeamPage() {
  const { farmId, role } = await requireFarmSession();
  if (role !== "OWNER") redirect("/dashboard");

  const users = await prisma.user.findMany({ where: { farmId }, orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="font-bold text-sm mb-2" style={{ color: "var(--olive-dark)" }}>Farm Team</div>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex justify-between items-center text-sm border-b py-2" style={{ borderColor: "var(--sand)" }}>
              <div>
                <div className="font-semibold">{u.name}</div>
                <div className="text-xs text-gray-500">{u.email}</div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: u.role === "OWNER" ? "#E8EFE3" : "#F7EBCE", color: u.role === "OWNER" ? "var(--olive-dark)" : "#8A6A1E" }}>
                {ROLE_LABELS[u.role]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="font-bold text-sm mb-2" style={{ color: "var(--olive-dark)" }}>+ Add Worker or Veterinarian</div>
        <p className="text-xs text-gray-500 mb-3">
          Farm Workers can log feeding, weight, health notes, births, and tasks — but cannot delete records or mark
          animals sold/dead/culled. Veterinarians can additionally access health, treatments, vaccinations, and pregnancy records.
        </p>
        <InviteForm farmId={farmId} />
      </div>
    </div>
  );
}
