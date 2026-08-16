import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fmtDate } from "@/lib/utils";
import Link from "next/link";

const ACTION_LABELS: Record<string, string> = {
  status_changed: "changed status of",
  marked_deceased: "marked deceased:",
  culled: "culled:",
  sold: "sold:",
  deleted: "permanently deleted",
  invited: "invited",
  removed: "removed",
  password_changed: "changed their password",
};

export default async function ActivityLogPage() {
  const { farmId, role } = await requireFarmSession();
  if (role !== "OWNER") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    where: { farmId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const userIds = [...new Set(logs.map((l) => l.byUserId).filter(Boolean))] as string[];
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : [];
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div className="space-y-3">
      <Link href="/settings" className="text-sm font-semibold" style={{ color: "var(--olive-dark)" }}>← Back to Settings</Link>
      <div className="card p-4">
        <div className="font-bold text-sm mb-3" style={{ color: "var(--olive-dark)" }}>Activity Log</div>
        <div className="text-xs text-gray-400 mb-3">Shows the last 100 tracked actions: status changes, deletions, and team/account changes.</div>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="text-sm border-b py-2" style={{ borderColor: "var(--sand)" }}>
              <div>
                <b>{log.byUserId ? userMap.get(log.byUserId) || "Unknown user" : "System"}</b>{" "}
                {ACTION_LABELS[log.action] || log.action}{" "}
                {log.entityType === "Goat" ? "a goat" : log.entityType === "BreedingRecord" ? "a mating record" : log.entityType === "User" ? "an account" : log.entityType}
                {log.toValue && <span className="text-gray-500"> — {log.toValue}</span>}
                {log.fromValue && !log.toValue && <span className="text-gray-500"> — {log.fromValue}</span>}
              </div>
              <div className="text-[11px] text-gray-400">{fmtDate(log.createdAt)}</div>
            </div>
          ))}
          {logs.length === 0 && <div className="text-center text-gray-400 py-6 text-sm">No tracked activity yet.</div>}
        </div>
      </div>
    </div>
  );
}
