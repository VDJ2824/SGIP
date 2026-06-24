import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { getMentorStudentRoadmap } from '@/services/mentorService';

export function MentorStudentRoadmap() {
  const { studentId } = useParams();
  const { data, loading, error, execute } = useAsync(() => getMentorStudentRoadmap(studentId));
  const roadmap = data?.data;
  if (loading && !data) return <Loader className="py-20" label="Loading student roadmap" />;
  if (error) return <ErrorMessage title="Roadmap unavailable" message={error.message} actionLabel="Retry" onAction={execute} />;
  if (!roadmap) return <EmptyState title="No roadmap generated" description="The assigned student has not created a roadmap yet." />;
  return <div className="space-y-6"><PageHeader eyebrow="Read-only mentor view" title={`${roadmap.targetRole} roadmap`} description={`${roadmap.overallProgress}% complete · ${roadmap.completedTasks} completed · ${roadmap.pendingTasks} pending`} /><div className="h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-brand-500" style={{ width: `${roadmap.overallProgress}%` }} /></div><div className="space-y-4">{roadmap.phases.map((phase) => <Card key={phase.phaseNumber}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-brand-200">Phase {phase.phaseNumber}</p><h2 className="mt-1 text-xl font-semibold text-white">{phase.title}</h2><p className="mt-1 text-sm text-slate-400">{phase.description}</p></div><Badge tone={phase.progress === 100 ? 'success' : 'info'}>{phase.progress}%</Badge></div><div className="mt-5 grid gap-3 md:grid-cols-2">{phase.tasks.map((task) => <div key={task.taskId} className="rounded-2xl bg-white/5 p-4"><div className="flex justify-between gap-3"><h3 className="font-medium text-white">{task.title}</h3><Badge tone={task.status === 'completed' ? 'success' : 'neutral'}>{task.status.replaceAll('_', ' ')}</Badge></div><p className="mt-2 text-sm text-slate-400">{task.description}</p><p className="mt-3 text-xs text-slate-500">{task.relatedSkill} · {task.estimatedHours} hours</p></div>)}</div></Card>)}</div></div>;
}
