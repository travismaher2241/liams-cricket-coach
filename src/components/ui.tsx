export function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted/80">{hint}</span>}
    </label>
  );
}

export function Bar({ value, max = 1, tone = "turf" }: { value: number; max?: number; tone?: "turf" | "gold" | "sky" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === "gold" ? "bg-gold" : tone === "sky" ? "bg-sky" : "bg-turf";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line/60">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
