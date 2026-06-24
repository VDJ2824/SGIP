import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';

const statuses = ['not_started', 'in_progress', 'completed', 'skipped'];

export function TaskCard({ task, onStatusChange, updating }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-white">{task.title}</h4>
          <p className="mt-1 text-sm leading-6 text-slate-400">{task.description}</p>
        </div>
        <Badge tone={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'}>
          {task.priority}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {task.relatedSkill ? <Badge tone="neutral">{task.relatedSkill}</Badge> : null}
        <Badge tone="neutral">{task.estimatedHours} hours</Badge>
        <Badge tone="neutral">{task.estimatedWeeks} weeks</Badge>
      </div>

      {task.suggestedResources?.length ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Resources</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {task.suggestedResources.map((resource) => (
              <span key={resource} className="inline-flex items-center gap-1 text-sm text-brand-200">
                <ExternalLink className="h-3.5 w-3.5" /> {resource}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {task.suggestedProjects?.length ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Suggested project</p>
          <p className="mt-1 text-sm text-slate-300">{task.suggestedProjects.join(', ')}</p>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Completion criteria</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {task.completionCriteria?.map((criterion) => <li key={criterion}>• {criterion}</li>)}
        </ul>
      </div>

      <Select
        className="mt-4"
        label="Task status"
        value={task.status}
        disabled={updating}
        onChange={(event) => onStatusChange(task.taskId, event.target.value)}
      >
        {statuses.map((status) => (
          <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
        ))}
      </Select>
    </div>
  );
}
