"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "/icons/home.png" },
  { href: "/herd", label: "Herd", icon: "/icons/herd.png" },
  { href: "/breeding", label: "Breed", icon: "/icons/breeding.png" },
  { href: "/health", label: "Health", icon: "/icons/health.png" },
  { href: "/finance", label: "Money", icon: "/icons/finance.png" },
  { href: "/tasks", label: "Tasks", icon: "/icons/tasks.png" },
  { href: "/reports", label: "Stats", icon: "/icons/reports.png" },
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
              <img
                src={it.icon}
                alt=""
                className="w-5 h-5 object-contain"
                style={{ opacity: active ? 1 : 0.55, filter: active ? "none" : "grayscale(30%)" }}
              />
              <span className="text-[9px] leading-none font-semibold whitespace-nowrap">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
