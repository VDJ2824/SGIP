import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StudentSkillSummary } from '@/components/mentor/StudentSkillSummary';
import { StudentGapSummary } from '@/components/mentor/StudentGapSummary';
import { StudentRoadmapSummary } from '@/components/mentor/StudentRoadmapSummary';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { getMentorStudent } from '@/services/mentorService';

export function MentorStudentDetail() {
  const { studentId } = useParams();
  const { data, loading, error, execute } = useAsync(() => getMentorStudent(studentId));
  const detail = data?.data;
  if (loading && !detail) return <Loader className="py-20" label="Loading student profile" />;
  if (error) return <ErrorMessage title="Student unavailable" message={error.message} actionLabel="Retry" onAction={execute} />;
  if (!detail) return null;
  return <div className="space-y-6"><PageHeader eyebrow="Assigned student" title={detail.student?.name || detail.profile?.personal?.fullName} description={`${detail.student?.email || detail.profile?.personal?.email} · ${detail.profile?.personal?.targetRole || 'No target role selected'}`} actions={<Button as={Link} to="/mentor/students" variant="secondary">Back to students</Button>} />
    <div className="grid gap-4 md:grid-cols-3"><Card><p className="text-sm text-slate-400">Profile completion</p><p className="mt-2 text-3xl font-semibold text-white">{detail.profile?.profileCompletion || 0}%</p></Card><Card><p className="text-sm text-slate-400">Evidence records</p><p className="mt-2 text-3xl font-semibold text-white">{detail.evidenceSummary?.total || 0}</p></Card><Card><p className="text-sm text-slate-400">Account status</p><Badge className="mt-3" tone={detail.student?.isActive ? 'success' : 'danger'}>{detail.student?.isActive ? 'Active' : 'Inactive'}</Badge></Card></div>
    <StudentSkillSummary summary={detail.skillsSummary} />
    <div className="grid gap-6 xl:grid-cols-2"><StudentGapSummary studentId={studentId} report={detail.latestGapReport} /><StudentRoadmapSummary studentId={studentId} roadmap={detail.latestRoadmap} /></div>
  </div>;
}
