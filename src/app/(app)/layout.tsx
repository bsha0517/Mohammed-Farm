import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const farm = await prisma.farm.findUnique({ where: { id: (session.user as any).farmId } });

  return (
    <div className="min-h-screen" style={{ background: "var(--sand)", paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ background: "var(--olive)" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-white/70 text-[10px] sm:text-[11px] tracking-widest uppercase truncate">
              {farm?.name} {farm?.location ? `· ${farm.location}` : ""}
            </div>
            <Link href="/dashboard" className="text-white text-lg sm:text-xl font-bold block truncate" style={{ fontFamily: "Georgia, serif" }}>
              🐐 Farm Manager
            </Link>
          </div>
          <div className="shrink-0">
            <SignOutButton />
          </div>
        </div>
      </div>
      <main className="max-w-3xl mx-auto px-4 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
