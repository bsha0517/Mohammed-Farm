"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/herd", label: "Herd", icon: "🐐" },
  { href: "/breeding", label: "Breed", icon: "💞" },
  { href: "/health", label: "Health", icon: "🩺" },
  { href: "/finance", label: "Money", icon: "💰" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/reports", label: "Stats", icon: "📊" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t"
      style={{ borderColor: "var(--sand-deep)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-3xl mx-auto grid grid-cols-7">
        {ITEMS.map((it) => {
          const active = pathname?.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex flex-col items-center justify-center py-1.5 px-0.5 gap-0.5 min-w-0"
              style={{ color: active ? "var(--olive)" : "#9C917B" }}
            >
              <span className="text-base leading-none">{it.icon}</span>
              <span className="text-[9px] leading-none font-semibold whitespace-nowrap">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
