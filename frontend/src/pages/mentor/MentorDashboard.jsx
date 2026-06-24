import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { MentorStatsCards } from '@/components/mentor/MentorStatsCards';
import { ReviewDecisionBadge } from '@/components/mentor/ReviewDecisionBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { getMentorDashboard } from '@/services/mentorService';
import { formatDateTimeDetailed } from '@/utils/formatters';

export function MentorDashboard() {
  const { data, loading, error, execute } = useAsync(getMentorDashboard);
  const dashboard = data?.data;
  if (loading && !dashboard) return <Loader className="py-20" label="Loading mentor dashboard" />;
  if (error) return <ErrorMessage title="Mentor dashboard unavailable" message={error.message} actionLabel="Retry" onAction={execute} />;
  return <div className="space-y-6"><PageHeader eyebrow="Mentor workspace" title="Mentor dashboard" description="Track assigned students, evidence decisions, and readiness signals that need your attention." actions={<Button as={Link} to="/mentor/evidence-review">Open review queue</Button>} />
    <MentorStatsCards stats={dashboard} />
    <div className="grid gap-6 xl:grid-cols-2">
      <Card><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-white">Students needing attention</h2><Button as={Link} to="/mentor/students" size="sm" variant="ghost" icon={ArrowRight}>All students</Button></div><div className="mt-4 space-y-3">{dashboard?.studentsNeedingAttention?.length ? dashboard.studentsNeedingAttention.map((student) => <Link key={student.id} to={`/mentor/students/${student.id}`} className="flex items-center justify-between rounded-2xl bg-white/5 p-4"><div><p className="font-medium text-white">{student.name}</p><p className="text-sm text-slate-400">{student.targetRole || 'No target role selected'}</p></div><span className="text-lg font-semibold text-amber-700">{student.readinessScore}%</span></Link>) : <p className="text-sm text-slate-400">No assigned student currently falls below the attention threshold.</p>}</div></Card>
      <Card><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-white">Recent reviews</h2><Button as={Link} to="/mentor/reviews" size="sm" variant="ghost" icon={ArrowRight}>History</Button></div><div className="mt-4 space-y-3">{dashboard?.recentReviews?.length ? dashboard.recentReviews.map((review) => <div key={review._id} className="rounded-2xl bg-white/5 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-white">{review.skillLabel}</p><p className="text-sm text-slate-400">{review.student?.name} · {formatDateTimeDetailed(review.mentorReview.reviewedAt)}</p></div><ReviewDecisionBadge decision={review.mentorReview.decision} /></div></div>) : <p className="text-sm text-slate-400">No reviews completed yet.</p>}</div></Card>
    </div>
  </div>;
}
