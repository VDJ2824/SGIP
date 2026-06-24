import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { getMentorStudentGapReport, getMentorStudentLatestGapReportsByRole } from '@/services/mentorService';
import { formatDateTimeDetailed } from '@/utils/formatters';

export function MentorStudentGapReports() {
  const { studentId } = useParams();
  const request = useAsync(() => getMentorStudentLatestGapReportsByRole(studentId));
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const reports = request.data?.data || [];
  const open = async (reportId) => { setLoadingDetail(true); try { const result = await getMentorStudentGapReport(studentId, reportId); setDetail(result.data); } finally { setLoadingDetail(false); } };
  if (request.loading && !request.data) return <Loader className="py-20" label="Loading gap reports" />;
  return <div className="space-y-6"><PageHeader eyebrow="Read-only mentor view" title="Student gap report history" description="The most recent analysis is shown once for every career role the student has selected." />{request.error ? <ErrorMessage title="Gap reports unavailable" message={request.error.message} actionLabel="Retry" onAction={request.execute} /> : reports.length ? <div className="grid gap-4 md:grid-cols-2">{reports.map((report) => <Card key={report.id}><div className="flex justify-between gap-4"><div><h2 className="text-lg font-semibold text-white">{report.targetRole}</h2><p className="mt-1 text-sm text-slate-400">{formatDateTimeDetailed(report.generatedAt)}</p></div><span className="text-3xl font-semibold text-brand-200">{report.readinessScore}%</span></div><p className="mt-4 text-sm text-slate-400">{report.missingRequiredSkills.length} missing required · {report.weakEvidenceSkills.length} weak evidence</p><Button className="mt-4" variant="secondary" isLoading={loadingDetail} onClick={() => open(report.id)}>View details</Button></Card>)}</div> : <EmptyState title="No gap reports" description="The student has not generated a gap analysis yet." />}
    {detail ? <Card><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-400">Detailed report</p><h2 className="mt-1 text-2xl font-semibold text-white">{detail.targetRoleSnapshot?.title}</h2></div><Button variant="ghost" onClick={() => setDetail(null)}>Close</Button></div><div className="mt-5 grid gap-6 md:grid-cols-2"><div><h3 className="font-semibold text-white">Missing required skills</h3><div className="mt-3 flex flex-wrap gap-2">{detail.missingRequiredSkills?.map((skill) => <Badge key={skill.normalizedName || skill.skillName} tone="danger">{skill.skillName}</Badge>)}</div></div><div><h3 className="font-semibold text-white">Weak evidence</h3><div className="mt-3 flex flex-wrap gap-2">{detail.weakEvidenceSkills?.map((skill) => <Badge key={skill.normalizedName || skill.skillName} tone="warning">{skill.skillName}</Badge>)}</div></div></div></Card> : null}
  </div>;
}
