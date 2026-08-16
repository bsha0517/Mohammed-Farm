import { requireFarmSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SettingsPage() {
  const { farmId, role, email } = await requireFarmSession();
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });

  const LinkRow = ({ href, title, desc }: { href: string; title: string; desc: string }) => (
    <Link href={href} className="flex items-center justify-between card p-4">
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <span className="text-gray-300">→</span>
    </Link>
  );

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="font-bold text-sm" style={{ color: "var(--olive-dark)" }}>{farm?.name}</div>
        <div className="text-xs text-gray-500">{farm?.location}</div>
        <div className="text-xs text-gray-400 mt-2">Signed in as {email} ({role === "OWNER" ? "Owner / Admin" : role === "VET" ? "Veterinarian" : "Farm Worker"})</div>
      </div>

      {role === "OWNER" && (
        <LinkRow href="/team" title="Team & Accounts" desc="Add or remove Worker and Veterinarian logins" />
      )}
      {role === "OWNER" && (
        <LinkRow href="/settings/activity" title="Activity Log" desc="Who changed what, and when" />
      )}
      <LinkRow href="/settings/password" title="Change Password" desc="Update your own login password" />
      <LinkRow href="/inventory" title="Inventory & Feed" desc="Stock levels, expiry alerts, feeding records" />
      <LinkRow href="/reports/print" title="Print Full Report" desc="Save a farm summary as PDF" />
    </div>
  );
}
