import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TaskCard } from './TaskCard';

export function PhaseAccordion({ phase, onStatusChange, updating }) {
  const [open, setOpen] = useState(phase.phaseNumber <= 2 || phase.tasks?.length > 0);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Phase {phase.phaseNumber}</p>
          <h3 className="mt-1 text-xl font-semibold text-white">{phase.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{phase.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">{phase.estimatedWeeks} weeks</Badge>
            <Badge tone={phase.progress === 100 ? 'success' : 'info'}>{phase.progress}%</Badge>
            <Badge tone="neutral">{phase.tasks?.length || 0} tasks</Badge>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="grid gap-4 border-t border-white/10 p-5 lg:grid-cols-2 2xl:grid-cols-3">
          {phase.tasks?.map((task) => (
            <TaskCard key={task.taskId} task={task} onStatusChange={onStatusChange} updating={updating} />
          ))}
          {!phase.tasks?.length ? <p className="text-sm text-slate-400">No actions are required in this phase.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
