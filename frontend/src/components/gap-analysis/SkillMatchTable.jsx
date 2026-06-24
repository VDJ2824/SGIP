import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export function SkillMatchTable({ title, items = [], status, tone = 'info' }) {
  const evidenceLabel = (item) => {
    const value = item.bestEvidenceStatus || item.evidenceStatuses?.[0] || 'none';
    if (value === 'student_confirmed') return 'Student Confirmed';
    if (value === 'mentor_approved') return 'Mentor Approved';
    if (value === 'pending_review') return 'Pending Review';
    if (value === 'none' || value === 'draft') return 'Needs Evidence';
    return value.replaceAll('_', ' ');
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <Badge tone={tone}>{items.length}</Badge>
      </div>
      {!items.length ? <p className="mt-4 text-sm text-slate-400">No skills in this category.</p> : null}
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={`${status}-${item.normalizedName}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-white">{item.skillName}</p>
              <Badge tone={tone}>{status}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">{item.explanation}</p>
            {item.matchedStudentSkills?.length ? (
              <div className="mt-3 grid gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Student skill</p>
                  <p className="mt-1 text-slate-200">{item.matchedStudentSkills.join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Required level</p>
                  <p className="mt-1 text-slate-200">{item.requiredLevel || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Student level</p>
                  <p className="mt-1 text-slate-200">{item.studentLevel || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Match type</p>
                  <p className="mt-1 capitalize text-slate-200">{String(item.matchType || 'exact').replaceAll('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Evidence status</p>
                  <p className="mt-1 capitalize text-slate-200">{evidenceLabel(item)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Match confidence</p>
                  <p className="mt-1 text-slate-200">{Math.round(Number(item.confidence || 0) * 100)}%</p>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
