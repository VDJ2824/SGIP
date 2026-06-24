import { AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { getGapAnalysisHistory } from '@/services/gapAnalysisService';
import { GapAnalysisHistoryTable } from '@/components/gap-analysis/GapAnalysisHistoryTable';

export function GapAnalysisHistory() {
  const { data, loading, error, execute } = useAsync(() => getGapAnalysisHistory({ limit: 50 }));
  const reports = data?.data || [];
  if (loading && !data) return <Loader className="py-20" label="Loading gap history" />;
  if (error) return <ErrorMessage title="History unavailable" message={error.message} icon={AlertCircle} />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Assessment history" title="Gap analysis history" description="Review previous role snapshots and readiness scores." actions={<Button variant="secondary" onClick={execute}>Refresh</Button>} />
      {reports.length ? <GapAnalysisHistoryTable reports={reports} /> : <EmptyState title="No reports yet" description="Run your first gap analysis to create history." />}
    </div>
  );
}
