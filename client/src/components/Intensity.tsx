const LABELS = { 1: "Low intensity", 2: "Medium intensity", 3: "High intensity" } as const;

export function Intensity({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={LABELS[level]} aria-label={LABELS[level]}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-3 w-1 rounded-full ${i <= level ? "bg-volt-400" : "bg-ink-700"}`} style={{ height: `${6 + i * 3}px` }} />
      ))}
    </span>
  );
}
