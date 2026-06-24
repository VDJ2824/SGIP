import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function AiRoleReviewCard({ role, onReview, saving }) {
  return <Card>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-white">{role.title}</h2><p className="mt-1 text-sm text-slate-400">{role.category} · {role.experienceLevel}</p></div><Badge tone="warning">Pending AI review</Badge></div>
    <p className="mt-4 text-sm leading-6 text-slate-300">{role.description}</p>
    <div className="mt-4 flex flex-wrap gap-2">{role.requiredSkills?.map((skill) => <Badge key={skill.normalizedName || skill.name}>{skill.name}</Badge>)}</div>
    <div className="mt-5 flex gap-3"><Button disabled={saving} onClick={() => onReview(role, 'approved')}>Approve</Button><Button disabled={saving} variant="danger" onClick={() => onReview(role, 'rejected')}>Reject</Button></div>
  </Card>;
}
