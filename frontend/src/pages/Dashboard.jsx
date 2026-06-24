import { AlertCircle, Award, BadgeCheck, BellRing, FileText, FileUp, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { useAsync } from '@/hooks/useAsync';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getDashboardSnapshot } from '@/services/dashboardService';
import { downloadReportPdf, saveReportBlob } from '@/services/reportService';
import { downloadRoadmapPdf } from '@/services/roadmapService';
import { formatPercent } from '@/utils/formatters';
import { UserCircle2 } from 'lucide-react';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card-grid">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { runWithLoading } = useAppContext();
  const { user, refreshProfile } = useAuth();
  const { data, loading, error, execute } = useAsync(getDashboardSnapshot);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!data && !loading && !error) {
      execute();
    }
  }, [data, loading, error, execute]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await runWithLoading(() => execute(), { successMessage: 'Dashboard refreshed' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleGapDownload = async () => {
    const blob = await runWithLoading(() => downloadReportPdf('gap-analysis'), {
      successMessage: 'Gap report downloaded',
    });
    saveReportBlob(blob, 'gap-analysis');
  };

  const handleRoadmapDownload = async () => {
    if (!roadmap?._id) return;
    const blob = await runWithLoading(() => downloadRoadmapPdf(roadmap._id), {
      successMessage: 'Roadmap downloaded',
    });
    saveReportBlob(blob, 'roadmap');
  };

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorMessage title="Dashboard unavailable" message={error.message} icon={AlertCircle} />;
  }

  if (!data) {
    return (
      <EmptyState
        title="No dashboard data yet"
        description="Reload to pull the latest placement readiness snapshot."
        actionLabel="Reload dashboard"
        onAction={handleRefresh}
      />
    );
  }

  const profile = data.profile || {};
  const analytics = data.analytics || {};
  const gapAnalysis = data.gapAnalysis || {};
  const roadmap = data.roadmap || null;
  const roadmapPhases = roadmap?.phases || [];
  const roadmapTasks = roadmapPhases.flatMap((phase) => phase.tasks || []);
  const notifications = Array.isArray(data.notifications) ? data.notifications : [];
  const skillEvidence = Array.isArray(data.skillEvidence) ? data.skillEvidence : [];
  const latestResume = Array.isArray(data.resumes) ? data.resumes[0] : null;
  const liveReadiness = gapAnalysis.readinessScore ?? profile.overallReadiness ?? analytics.evidenceCoverage ?? 0;
  const liveRoadmapProgress = roadmap?.overallProgress ?? analytics.roadmapCompletion ?? 0;
  const tasksRemaining = roadmapTasks.filter((task) => !['completed', 'skipped'].includes(task.status)).length;
  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const evidenceItems = skillEvidence.flatMap((group) => group.evidence || []);
  const pendingEvidence = evidenceItems.filter((item) => item.verificationStatus === 'pending').length;
  const missingRequiredCount = gapAnalysis.missingRequiredSkills?.length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student command center"
        title="Dashboard"
        description="Monitor readiness, progress, and the next actions that matter most."
        actions={
          <>
            <Button variant="secondary" onClick={handleRefresh} isLoading={refreshing}>
              Refresh
            </Button>
            <Button as={Link} to="/roadmap">
              View roadmap
            </Button>
          </>
        }
      />

      <div className="card-grid">
        <StatCard label="Readiness" value={formatPercent(liveReadiness)} helper="Placement fit score" icon={Award} />
        <StatCard label="Missing required" value={missingRequiredCount} helper="Skills blocking role readiness" icon={Target} />
        <StatCard label="Roadmap progress" value={formatPercent(liveRoadmapProgress)} helper={`${tasksRemaining} tasks remaining`} icon={TrendingUp} />
        <StatCard label="Pending evidence" value={pendingEvidence} helper={`${unreadNotifications} unread notifications`} icon={BellRing} />
      </div>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Authenticated profile</p>
              <h2 className="text-xl font-semibold text-white">{user?.name || 'Profile not loaded'}</h2>
              <p className="text-sm text-slate-400">{user?.email || 'Your account email will appear here after login.'}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={refreshProfile}>
            Refresh profile
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
              <FileUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Resume extraction</p>
              <h2 className="text-xl font-semibold text-white">{latestResume?.originalFileName || 'Upload a resume to extract skills'}</h2>
              <p className="text-sm text-slate-400">
                {latestResume ? `Status: ${latestResume.status}` : 'Extract skills from a redacted resume, then save reviewed skills to evidence.'}
              </p>
            </div>
          </div>
          <Button as={Link} to={latestResume ? `/resumes/${latestResume._id}/review` : '/resumes/upload'} variant="secondary">
            {latestResume ? 'Review resume' : 'Upload resume'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Placement snapshot</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Your current readiness profile</h2>
            </div>
            <Badge tone="success">Live</Badge>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Target role</p>
              <p className="mt-2 text-2xl font-semibold text-white">{profile.personal?.targetRole || 'Not set'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.personal?.targetRoleSource ? (
                  <Badge tone={profile.personal.targetRoleSource === 'ai_generated' ? 'warning' : 'success'}>
                    {profile.personal.targetRoleSource === 'ai_generated' ? 'AI Generated' : 'Seeded'}
                  </Badge>
                ) : null}
                {profile.personal?.targetRoleSelectedAt ? (
                  <Badge tone="neutral">{`Last selected ${new Date(profile.personal.targetRoleSelectedAt).toLocaleDateString()}`}</Badge>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Profile completeness</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatPercent(liveReadiness)}</p>
            </div>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-400" style={{ width: `${liveReadiness}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {gapAnalysis.recommendations?.[0] ||
              'Connect profile, evidence, roadmap, and reports data to keep this snapshot current.'}
          </p>
          {gapAnalysis._id ? (
            <Button as={Link} to={`/gaps/${gapAnalysis._id}`} variant="secondary" className="mt-5">
              View gap report
            </Button>
          ) : null}
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Priority signals</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Gap analysis highlights</h2>
            </div>
            <Badge tone="warning">{formatPercent(gapAnalysis.readinessScore || 0)}</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {Object.entries(gapAnalysis.componentScores || {}).slice(0, 3).map(([key, item]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium capitalize text-white">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <Badge tone={item.rawScore >= 70 ? 'success' : item.rawScore >= 40 ? 'info' : 'warning'}>
                    {formatPercent(item.rawScore)}
                  </Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-brand-400" style={{ width: `${item.rawScore}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-brand-200" />
              <p className="text-sm font-medium text-white">Top recommendation</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{gapAnalysis.recommendations?.[0] || 'No recommendation available yet.'}</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <p className="text-sm text-slate-400">Next action</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Today’s focus</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            {roadmapTasks.filter((task) => task.status !== 'completed').slice(0, 3).map((task, index) => (
              <p key={task.taskId}>{index + 1}. {task.title}</p>
            ))}
            {!roadmapTasks.length ? <p>Generate a roadmap from your latest Gap Analysis report.</p> : null}
          </div>
          <Button className="mt-6 w-full" as={Link} to="/roadmap">
            Continue roadmap
          </Button>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Milestones</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Roadmap preview</h2>
            </div>
            <Badge tone={roadmap?.status === 'completed' ? 'success' : 'info'}>{roadmap?.status || 'Not generated'}</Badge>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {roadmapPhases.slice(0, 3).map((step) => (
              <div key={step.phaseNumber} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-brand-200">Phase {step.phaseNumber}</p>
                <p className="mt-2 font-semibold text-white">{step.title}</p>
                <p className="mt-2 text-xs text-slate-500">{step.estimatedWeeks} estimated weeks</p>
                <div className="mt-3 h-2 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-brand-400" style={{ width: `${step.progress || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-brand-500/15 p-3 text-brand-200"><FileText className="h-6 w-6" /></div>
            <div><p className="text-sm text-slate-400">Latest reports</p><h2 className="text-xl font-semibold text-white">Your placement reports center</h2><p className="text-sm text-slate-400">Profile, resume, gap, roadmap, evidence, and historical progress.</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button as={Link} to="/reports">View reports</Button>
            <Button variant="secondary" disabled={!gapAnalysis?._id} onClick={handleGapDownload}>Download latest gap</Button>
            <Button variant="secondary" disabled={!roadmap?._id} onClick={handleRoadmapDownload}>Download latest roadmap</Button>
            <Button as={Link} to="/reports/progress" variant="secondary">View progress</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
