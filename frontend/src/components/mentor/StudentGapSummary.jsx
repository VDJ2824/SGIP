import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function StudentGapSummary({ studentId, report }) {
  return <Card><p className="text-sm text-slate-400">Latest gap analysis</p>{report ? <><div className="mt-3 flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold text-white">{report.targetRole}</h2><p className="mt-1 text-sm text-slate-400">{report.missingRequiredSkills?.length || 0} required skills missing</p></div><p className="text-3xl font-semibold text-brand-200">{report.readinessScore}%</p></div><Button as={Link} to={`/mentor/students/${studentId}/gap-reports`} variant="secondary" className="mt-5">View gap reports</Button></> : <p className="mt-3 text-sm text-slate-400">No gap analysis generated yet.</p>}</Card>;
}
