import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { useAsync } from '@/hooks/useAsync';
import { getRoadmapHistory } from '@/services/roadmapService';

export function RoadmapHistory() {
  const { data, loading } = useAsync(() => getRoadmapHistory({ limit: 50 }));
  const items = data?.data || [];
  if (loading && !data) return <Loader className="py-20" label="Loading roadmap history" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Roadmap history" eyebrow="Past action plans" actions={<Button as={Link} to="/roadmap">Current roadmap</Button>} />
      {!items.length ? <EmptyState title="No roadmap history" description="Generated roadmaps will appear here." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item._id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{item.targetRoleSnapshot?.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">Generated from readiness {item.readinessScoreAtGeneration}%</p>
                </div>
                <Badge tone={item.status === 'completed' ? 'success' : 'info'}>{item.status}</Badge>
              </div>
              <p className="mt-4 text-sm text-slate-300">{item.overallProgress}% complete · {item.estimatedCompletionWeeks} weeks</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
