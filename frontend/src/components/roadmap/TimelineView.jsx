export function TimelineView({ phases = [] }) {
  return (
    <div className="flex flex-col gap-2">
      {phases.map((phase, index) => (
        <div key={phase.phaseNumber} className="flex gap-4">
          <div className="flex w-8 flex-col items-center">
            <span className={`h-4 w-4 rounded-full ${phase.progress === 100 ? 'bg-emerald-400' : 'bg-brand-400'}`} />
            {index < phases.length - 1 ? <span className="my-1 h-full min-h-12 w-px bg-white/15" /> : null}
          </div>
          <div className="pb-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Phase {phase.phaseNumber}</p>
            <p className="font-medium text-white">{phase.title}</p>
            <p className="text-sm text-slate-400">{phase.progress}% complete</p>
          </div>
        </div>
      ))}
    </div>
  );
}
