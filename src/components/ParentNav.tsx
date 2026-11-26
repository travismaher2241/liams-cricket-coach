"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/parent", "Overview"],
  ["/parent/programmes", "Programmes"],
  ["/parent/notes", "Private notes"],
  ["/parent/matches", "Matches"],
  ["/parent/schedule", "Schedule"],
  ["/parent/iq", "Cricket IQ"],
  ["/parent/mind", "Mental coaching"],
  ["/parent/wellbeing", "Confidence & enjoyment"],
  ["/parent/activity", "Training"],
  ["/parent/profile", "Profile & setup"],
];

export default function ParentNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1">
      {LINKS.map(([href, label]) => {
        const on = href === "/parent" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold ${on ? "bg-turf text-pitch" : "bg-surface-2 text-muted hover:text-ink"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
