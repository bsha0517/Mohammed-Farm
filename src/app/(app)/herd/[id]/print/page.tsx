import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { generateGoatQrDataUrl } from "@/lib/qrcode";
import { fmtDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

export default async function GoatPrintPage({ params }: { params: { id: string } }) {
  const { farmId } = await requireFarmSession();
  const goat = await prisma.goat.findFirst({ where: { id: params.id, farmId } });
  if (!goat) notFound();

  const qr = await generateGoatQrDataUrl(goat.id);

  return (
    <div>
      <div className="print:hidden flex items-center justify-between mb-4">
        <Link href={`/herd/${goat.id}`} className="text-sm font-semibold" style={{ color: "var(--olive-dark)" }}>← Back</Link>
        <PrintButton label="Print tag" />
      </div>

      <div className="mx-auto bg-white border rounded-2xl p-6 text-center max-w-xs" style={{ borderColor: "var(--sand-deep)" }}>
        <img src={qr} alt={`QR code for ${goat.name}`} className="w-48 h-48 mx-auto" />
        <div className="mt-3 font-extrabold text-xl" style={{ fontFamily: "Georgia, serif" }}>{goat.name}</div>
        <div className="text-sm text-gray-500">{goat.tagId} · {goat.sex === "MALE" ? "Male" : "Female"} · {goat.breed}</div>
        {goat.earTag && <div className="text-xs text-gray-400 mt-1">Ear tag: {goat.earTag}</div>}
        <div className="text-xs text-gray-400">Born {fmtDate(goat.dob)}</div>
        <div className="text-[10px] text-gray-300 mt-3">Scan to open this goat's profile</div>
      </div>

      <div className="print:hidden text-center text-xs text-gray-400 mt-4">
        Print this and attach it to a stall card or keep with the ear tag records.
        Scanning the code opens this goat's profile directly (requires being signed in on the scanning device).
      </div>
    </div>
  );
}
