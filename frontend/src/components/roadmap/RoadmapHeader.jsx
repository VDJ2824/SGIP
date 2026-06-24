import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { RoadmapProgress } from './RoadmapProgress';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function RoadmapHeader({ roadmap, onDownload, downloading = false }) {
  const tasks = roadmap.phases?.flatMap((phase) => phase.tasks || []) || [];
  const remaining = tasks.filter((task) => !['completed', 'skipped'].includes(task.status)).length;

  return (
    <Card>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-sm text-slate-400">Current role</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{roadmap.targetRoleSnapshot?.title}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="info">Readiness {roadmap.readinessScoreAtGeneration}%</Badge>
            <Badge tone="neutral">{roadmap.estimatedCompletionWeeks} estimated weeks</Badge>
            <Badge tone={roadmap.status === 'completed' ? 'success' : 'warning'}>{roadmap.status}</Badge>
          </div>
          <Button
            className="mt-5"
            variant="secondary"
            icon={Download}
            onClick={onDownload}
            isLoading={downloading}
          >
            Download PDF
          </Button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Tasks remaining</p>
          <p className="mt-2 text-4xl font-semibold text-white">{remaining}</p>
        </div>
      </div>
      <div className="mt-6">
        <RoadmapProgress value={roadmap.overallProgress || 0} />
      </div>
    </Card>
  );
}
