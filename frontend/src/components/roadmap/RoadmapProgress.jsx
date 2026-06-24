export function RoadmapProgress({ value = 0 }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Overall progress</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-400 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
