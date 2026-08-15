import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import KiddingForm from "@/components/forms/KiddingForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function RecordKiddingPage({ params }: { params: { id: string } }) {
  const { farmId } = await requireFarmSession();
  const rec = await prisma.breedingRecord.findFirst({ where: { id: params.id, farmId }, include: { female: true, male: true } });
  if (!rec) notFound();

  return (
    <div>
      <Link href="/breeding" className="text-sm font-semibold" style={{ color: "var(--olive-dark)" }}>← Back</Link>
      <h1 className="text-lg font-bold my-3">Record Kidding — {rec.female.name}</h1>
      <div className="card p-4">
        <KiddingForm breedingId={rec.id} motherId={rec.femaleId} fatherId={rec.maleId} motherName={rec.female.name} fatherName={rec.male.name} />
      </div>
    </div>
  );
}
