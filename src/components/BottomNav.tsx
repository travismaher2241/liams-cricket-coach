"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Brain, Dumbbell, House, MessageCircle, Trophy, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/play", label: "Home", Icon: House },
  { href: "/play/train", label: "Train", Icon: Dumbbell },
  { href: "/play/learn", label: "Learn", Icon: BookOpen },
  { href: "/play/mind", label: "Mind", Icon: Brain },
  { href: "/play/journey", label: "Journey", Icon: Trophy },
  { href: "/play/coach", label: "Coach", Icon: MessageCircle },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-pitch/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-md grid-cols-6">
        {TABS.map((t) => {
          const on = t.href === "/play" ? path === "/play" : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${on ? "text-turf" : "text-muted"}`}
              >
                <t.Icon size={22} strokeWidth={on ? 2.25 : 1.75} aria-hidden />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
