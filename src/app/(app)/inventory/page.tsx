import { prisma } from "@/lib/prisma";
import { requireFarmSession } from "@/lib/auth";
import { fmtDate, money } from "@/lib/utils";
import InventoryForm from "@/components/forms/InventoryForm";
import FeedingForm from "@/components/forms/FeedingForm";
import Link from "next/link";

export default async function InventoryPage() {
  const { farmId } = await requireFarmSession();
  const [items, feedTypes, feedingRecords] = await Promise.all([
    prisma.inventoryItem.findMany({ where: { farmId }, orderBy: { item: "asc" } }),
    prisma.feedType.findMany({ where: { farmId }, orderBy: { name: "asc" } }),
    prisma.feedingRecord.findMany({ where: { farmId }, include: { feedType: true }, orderBy: { date: "desc" }, take: 15 }),
  ]);

  const now = new Date();
  const lowStock = items.filter((i) => i.minimumStockLevel != null && i.quantity <= i.minimumStockLevel);
  const expiringSoon = items.filter((i) => i.expiryDate && (i.expiryDate.getTime() - now.getTime()) / 86400000 <= 30);

  return (
    <div className="space-y-4">
      <Link href="/settings" className="text-sm font-semibold" style={{ color: "var(--olive-dark)" }}>← Back to Settings</Link>

      {(lowStock.length > 0 || expiringSoon.length > 0) && (
        <div className="card p-4" style={{ borderColor: "var(--clay)" }}>
          <div className="font-bold text-sm mb-2" style={{ color: "var(--clay)" }}>⚠ Stock Alerts</div>
          {lowStock.map((i) => (
            <div key={i.id} className="text-sm flex justify-between py-1">
              <span>{i.item} — low stock</span><span className="font-semibold">{i.quantity} {i.unit} left</span>
            </div>
          ))}
          {expiringSoon.map((i) => (
            <div key={i.id} className="text-sm flex justify-between py-1">
              <span>{i.item} — expiring soon</span><span className="font-semibold">{fmtDate(i.expiryDate)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card p-4">
        <div className="font-bold text-sm mb-2" style={{ color: "var(--olive-dark)" }}>📦 Farm Inventory</div>
        <details className="mb-3"><summary className="text-xs font-semibold cursor-pointer" style={{ color: "var(--olive-dark)" }}>+ Add item</summary><div className="mt-2"><InventoryForm /></div></details>
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm border-b py-1.5" style={{ borderColor: "var(--sand)" }}>
              <div>
                <div className="font-semibold">{i.item}</div>
                <div className="text-xs text-gray-500">{i.category}{i.supplier ? ` · ${i.supplier}` : ""}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{i.quantity} {i.unit}</div>
                {i.expiryDate && <div className="text-xs text-gray-400">Exp {fmtDate(i.expiryDate)}</div>}
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">No inventory items yet.</div>}
        </div>
      </div>

      <div className="card p-4">
        <div className="font-bold text-sm mb-2" style={{ color: "var(--olive-dark)" }}>🌾 Feed Records</div>
        <details className="mb-3"><summary className="text-xs font-semibold cursor-pointer" style={{ color: "var(--olive-dark)" }}>+ Log feeding</summary><div className="mt-2"><FeedingForm feedTypes={feedTypes.map((f) => ({ id: f.id, name: f.name }))} /></div></details>
        <div className="space-y-2">
          {feedingRecords.map((r) => (
            <div key={r.id} className="flex justify-between text-sm border-b py-1.5" style={{ borderColor: "var(--sand)" }}>
              <span>{r.feedType.name} — {r.animalGroup}</span>
              <span>{r.quantity} {r.unit} · {fmtDate(r.date)}</span>
            </div>
          ))}
          {feedingRecords.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">No feeding records yet.</div>}
        </div>
      </div>
    </div>
  );
}
