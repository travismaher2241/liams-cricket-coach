import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { requirePlayerView } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PlayLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requirePlayerView();
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-4">
      {session.role === "parent" && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-gold/15 px-3 py-2 text-xs text-gold">
          <span>Parent preview of the player app</span>
          <Link href="/parent" className="font-semibold underline">
            Back to dashboard
          </Link>
        </div>
      )}
      {children}
      <BottomNav />
    </div>
  );
}
