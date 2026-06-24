import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export function RoleSelectionSummary({ role = {} }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.25em] text-brand-200">Target career role</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{role.title || 'Not selected'}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="neutral">{role.category || 'General'}</Badge>
        <Badge tone="neutral">{role.experienceLevel || 'Entry Level'}</Badge>
        <Badge tone={role.source === 'ai_generated' ? 'warning' : 'success'}>
          {role.source === 'ai_generated' ? 'AI Generated' : 'Seeded'}
        </Badge>
        {role.reviewStatus === 'pending' ? <Badge tone="info">Pending Review</Badge> : null}
      </div>
    </Card>
  );
}
