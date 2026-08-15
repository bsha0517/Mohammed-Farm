import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import GoatForm from "@/components/GoatForm";
import Link from "next/link";

export default async function NewGoatPage() {
  const { farmId } = await requireFarmSession();
  const goats = await prisma.goat.findMany({ where: { farmId }, select: { id: true, name: true, sex: true } });

  return (
    <div>
      <Link href="/herd" className="text-sm font-semibold" style={{ color: "var(--olive-dark)" }}>← Back</Link>
      <h1 className="text-lg font-bold my-3">Add New Goat</h1>
      <div className="card p-4">
        <GoatForm mothers={goats.filter((g) => g.sex === "FEMALE") as any} fathers={goats.filter((g) => g.sex === "MALE") as any} />
      </div>
    </div>
  );
}
