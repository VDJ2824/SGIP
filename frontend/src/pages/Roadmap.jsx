import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, History, WandSparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { getLatestGapAnalysis } from '@/services/gapAnalysisService';
import {
  downloadRoadmapPdf,
  generateRoadmap,
  getLatestRoadmap,
  updateRoadmapTask,
} from '@/services/roadmapService';
import { RoadmapHeader } from '@/components/roadmap/RoadmapHeader';
import { PhaseAccordion } from '@/components/roadmap/PhaseAccordion';
import { TimelineView } from '@/components/roadmap/TimelineView';

export function Roadmap() {
  const { data, loading, error, execute, setData } = useAsync(getLatestRoadmap);
  const { data: gapResponse } = useAsync(getLatestGapAnalysis);
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const roadmap = data?.data || null;
  const gapReport = gapResponse?.data || null;

  const handleGenerate = async () => {
    if (!gapReport?._id) {
      toast.error('Run Gap Analysis before generating a roadmap');
      return;
    }
    setGenerating(true);
    try {
      const result = await generateRoadmap(gapReport._id);
      setData(result);
      toast.success('Personalized roadmap generated');
    } catch (err) {
      toast.error(err.message || 'Unable to generate roadmap');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    setUpdating(true);
    try {
      const result = await updateRoadmapTask(taskId, status);
      setData(result);
      toast.success('Task status updated');
    } catch (err) {
      toast.error(err.message || 'Unable to update task');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = async () => {
    if (!roadmap?._id) return;
    setDownloading(true);
    try {
      const blob = await downloadRoadmapPdf(roadmap._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sgip-roadmap.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Roadmap PDF downloaded');
    } catch (err) {
      toast.error(err.message || 'Unable to download roadmap PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !data) return <Loader className="py-20" label="Loading roadmap" />;
  if (error && error.status !== 404) {
    return <ErrorMessage title="Roadmap unavailable" message={error.message} icon={AlertCircle} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Action plan"
        title="Personalized roadmap"
        description="A deterministic learning plan generated from your stored Gap Analysis report."
        actions={
          <>
            <Button as={Link} to="/roadmap/history" variant="secondary" icon={History}>History</Button>
            <Button icon={WandSparkles} onClick={handleGenerate} isLoading={generating}>
              {roadmap ? 'Regenerate from latest gap' : 'Generate roadmap'}
            </Button>
          </>
        }
      />

      {!roadmap ? (
        <EmptyState
          title="No roadmap yet"
          description="Run Gap Analysis first, then generate an action plan from that report."
          actionLabel={gapReport ? 'Generate roadmap' : 'Open Gap Analysis'}
          onAction={gapReport ? handleGenerate : undefined}
        />
      ) : (
        <>
          <RoadmapHeader roadmap={roadmap} onDownload={handleDownload} downloading={downloading} />
          <div className="grid items-start gap-6 xl:grid-cols-[16rem_minmax(0,1fr)] 2xl:grid-cols-[18rem_minmax(0,1fr)]">
            <Card>
              <h2 className="mb-5 text-lg font-semibold text-white">Timeline</h2>
              <TimelineView phases={roadmap.phases || []} />
            </Card>
            <div className="space-y-4">
              {(roadmap.phases || []).map((phase) => (
                <PhaseAccordion
                  key={phase.phaseNumber}
                  phase={phase}
                  onStatusChange={handleStatusChange}
                  updating={updating}
                />
              ))}
            </div>
          </div>

          {roadmap.aiEnhancement?.used ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Optional AI enhancement</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {roadmap.aiEnhancement.motivationalExplanation}
              </p>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
