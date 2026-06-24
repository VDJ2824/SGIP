import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { getGapAnalysisReport } from '@/services/gapAnalysisService';
import { generateRoadmap as generateRoadmapFromReport } from '@/services/roadmapService';
import { RoleSelectionSummary } from '@/components/gap-analysis/RoleSelectionSummary';
import { ReadinessScoreCard } from '@/components/gap-analysis/ReadinessScoreCard';
import { ComponentScoreBreakdown } from '@/components/gap-analysis/ComponentScoreBreakdown';
import { SkillMatchTable } from '@/components/gap-analysis/SkillMatchTable';
import { MissingSkillsList } from '@/components/gap-analysis/MissingSkillsList';
import { WeakEvidenceList } from '@/components/gap-analysis/WeakEvidenceList';
import { RecommendationList } from '@/components/gap-analysis/RecommendationList';

export function GapAnalysisResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, execute } = useAsync(() => getGapAnalysisReport(id));
  const report = data?.data;
  if (loading && !report) return <Loader className="py-20" label="Loading gap report" />;
  if (error) return <ErrorMessage title="Gap report unavailable" message={error.message} icon={AlertCircle} />;
  if (!report) return null;

  const handleGenerateRoadmap = async () => {
    const result = await generateRoadmapFromReport(report._id);
    toast.success('Roadmap created from gap report');
    navigate('/roadmap', { state: { roadmapId: result.data?._id } });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Explainable result" title="Gap analysis result" description="Every score and classification below comes from deterministic rules." actions={<Button variant="secondary" onClick={execute}>Refresh</Button>} />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <ReadinessScoreCard score={report.readinessScore} />
        <RoleSelectionSummary role={report.targetRoleSnapshot} />
      </div>
      <ComponentScoreBreakdown scores={report.componentScores} />
      <div className="grid gap-6 xl:grid-cols-2">
        <SkillMatchTable title="Verified matches" items={report.verifiedMatches} status="Approved" tone="success" />
        <SkillMatchTable title="Student confirmed matches" items={report.studentConfirmedMatches} status="Student Confirmed" tone="info" />
        <SkillMatchTable title="Pending evidence matches" items={report.pendingEvidenceMatches} status="Pending Review" tone="warning" />
        <SkillMatchTable title="Unverified matches" items={report.unverifiedMatches} status="Pending" tone="warning" />
        <SkillMatchTable title="Partial matches" items={report.partialMatches} status="Partial" tone="info" />
        <WeakEvidenceList items={report.weakEvidenceSkills} />
        <MissingSkillsList title="Missing required skills" items={report.missingRequiredSkills} required />
        <MissingSkillsList title="Missing preferred skills" items={report.missingPreferredSkills} />
      </div>
      <RecommendationList items={report.recommendations} />
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleGenerateRoadmap}>Generate roadmap</Button>
        <Button as={Link} to="/evidence" variant="secondary">Upload more evidence</Button>
        <Button as={Link} to="/roles" variant="secondary">Change career role</Button>
      </div>
    </div>
  );
}
