"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/herd", label: "Herd", icon: "🐐" },
  { href: "/breeding", label: "Breeding", icon: "💞" },
  { href: "/health", label: "Health", icon: "🩺" },
  { href: "/finance", label: "Finance", icon: "💰" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/reports", label: "Reports", icon: "📊" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t" style={{ borderColor: "var(--sand-deep)" }}>
      <div className="max-w-3xl mx-auto grid grid-cols-7">
        {ITEMS.map((it) => {
          const active = pathname?.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href} className="flex flex-col items-center py-2 gap-0.5" style={{ color: active ? "var(--olive)" : "#9C917B" }}>
              <span className="text-lg">{it.icon}</span>
              <span className="text-[10px] font-semibold">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
