import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ReviewDecisionBadge } from './ReviewDecisionBadge';

export function StudentSkillSummary({ summary }) {
  return <Card><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-400">Skill profile</p><h2 className="mt-1 text-xl font-semibold text-white">{summary?.approved || 0} approved of {summary?.total || 0}</h2></div></div><div className="mt-5 flex flex-wrap gap-2">{summary?.items?.length ? summary.items.map((skill) => <div key={skill._id} className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2"><span className="text-sm text-white">{skill.name}</span><Badge>{skill.category}</Badge><ReviewDecisionBadge decision={skill.reviewState} /></div>) : <p className="text-sm text-slate-400">No skills added yet.</p>}</div></Card>;
}
