import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatDateTime } from '@/utils/formatters';

export function GapAnalysisHistoryTable({ reports = [] }) {
  return (
    <Card>
      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report._id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-white">{report.targetRoleSnapshot?.title}</p>
              <p className="mt-1 text-sm text-slate-400">{formatDateTime(report.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={report.status === 'generated' ? 'success' : 'neutral'}>{report.status}</Badge>
              <Badge tone="info">{Math.round(report.readinessScore)}%</Badge>
              <Button as={Link} to={`/gaps/${report._id}`} variant="secondary" size="sm">View</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
