"use client";

/** One question at a time with big buttons. */
export function OptionQuestion({
  title,
  options,
  onPick,
  allowSkip = true,
  multi,
  selected,
  extra,
}: {
  title: string;
  options: { value: string; label: string }[];
  onPick: (v: string) => void;
  allowSkip?: boolean;
  multi?: boolean;
  selected?: string[];
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold leading-snug">{title}</h2>
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onPick(o.value)}
            className={`choice ${multi && selected?.includes(o.value) ? "choice-on" : ""}`}
          >
            {multi && <span className="mr-2">{selected?.includes(o.value) ? "✅" : "⬜"}</span>}
            {o.label}
          </button>
        ))}
      </div>
      {extra}
      {allowSkip && !multi && (
        <button type="button" onClick={() => onPick("skip")} className="mt-1 text-center text-sm text-muted underline">
          Skip this one
        </button>
      )}
    </div>
  );
}

export function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-turf" : "bg-line"}`} />
      ))}
    </div>
  );
}

export const opts = (labels: string[]) => labels.map((l) => ({ value: l, label: l }));
