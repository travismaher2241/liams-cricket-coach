"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/play", label: "Home", icon: "🏠" },
  { href: "/play/train", label: "Train", icon: "🏏" },
  { href: "/play/learn", label: "Learn", icon: "🧠" },
  { href: "/play/journey", label: "Journey", icon: "🏆" },
  { href: "/play/coach", label: "Coach", icon: "💬" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-pitch/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((t) => {
          const on = t.href === "/play" ? path === "/play" : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${on ? "text-turf" : "text-muted"}`}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {t.icon}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
