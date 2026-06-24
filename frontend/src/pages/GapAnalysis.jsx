import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, History, Play } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { getProfile } from '@/services/profileService';
import { getLatestGapAnalysis, runGapAnalysis } from '@/services/gapAnalysisService';
import { RoleSelectionSummary } from '@/components/gap-analysis/RoleSelectionSummary';

export function GapAnalysis() {
  const navigate = useNavigate();
  const { data: profileResponse, loading: profileLoading, error: profileError } = useAsync(getProfile);
  const { data: latestResponse, loading: latestLoading } = useAsync(getLatestGapAnalysis);
  const profile = profileResponse?.data || null;
  const latest = latestResponse?.data || null;
  const roleId = profile?.personal?.targetRoleId;

  const run = async () => {
    const result = await runGapAnalysis(roleId);
    navigate(`/gaps/${result.data._id}`);
  };

  if (profileLoading || latestLoading) return <Loader className="py-20" label="Loading gap analysis" />;
  if (profileError) return <ErrorMessage title="Unable to load profile" message={profileError.message} icon={AlertCircle} />;
  if (!roleId) {
    return <EmptyState title="Choose a career role first" description="Gap analysis uses the selected stored career role." actionLabel="Open career roles" onAction={() => navigate('/roles')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Deterministic assessment"
        title="Gap analysis"
        description="Compare your automatically collected skills and mentor-reviewed evidence against your selected role."
        actions={<Button as={Link} to="/gaps/history" variant="secondary" icon={History}>History</Button>}
      />
      <RoleSelectionSummary role={{
        title: profile.personal.targetRole,
        source: profile.personal.targetRoleSource,
        reviewStatus: profile.personal.targetRoleReviewStatus,
      }} />
      {latest ? (
        <div className="flex flex-wrap gap-3">
          <Button as={Link} to={`/gaps/${latest._id}`}>View latest report</Button>
          <Button variant="secondary" icon={Play} onClick={run}>Run new analysis</Button>
        </div>
      ) : (
        <EmptyState title="No report generated yet" description="Run the deterministic scoring engine using your current skills and evidence." actionLabel="Run gap analysis" onAction={run} />
      )}
    </div>
  );
}
