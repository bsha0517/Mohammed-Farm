import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import GoatForm from "@/components/GoatForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditGoatPage({ params }: { params: { id: string } }) {
  const { farmId } = await requireFarmSession();
  const goat = await prisma.goat.findFirst({ where: { id: params.id, farmId } });
  if (!goat) notFound();

  const goats = await prisma.goat.findMany({ where: { farmId, id: { not: goat.id } }, select: { id: true, name: true, sex: true } });

  return (
    <div>
      <Link href={`/herd/${goat.id}`} className="text-sm font-semibold" style={{ color: "var(--olive-dark)" }}>← Back</Link>
      <h1 className="text-lg font-bold my-3">Edit {goat.name}</h1>
      <div className="card p-4">
        <GoatForm initial={goat} mothers={goats.filter((g) => g.sex === "FEMALE") as any} fathers={goats.filter((g) => g.sex === "MALE") as any} />
      </div>
    </div>
  );
}
