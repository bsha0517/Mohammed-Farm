import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import BreedingForm from "@/components/forms/BreedingForm";
import Link from "next/link";

export default async function NewBreedingPage() {
  const { farmId } = await requireFarmSession();
  const goats = await prisma.goat.findMany({ where: { farmId, status: { notIn: ["DEAD", "SOLD"] } } });

  return (
    <div>
      <Link href="/breeding" className="text-sm font-semibold" style={{ color: "var(--olive-dark)" }}>← Back</Link>
      <h1 className="text-lg font-bold my-3">Record Mating</h1>
      <div className="card p-4">
        <BreedingForm
          females={goats.filter((g) => g.sex === "FEMALE").map((g) => ({ id: g.id, name: g.name }))}
          males={goats.filter((g) => g.sex === "MALE").map((g) => ({ id: g.id, name: g.name }))}
        />
      </div>
    </div>
  );
}
