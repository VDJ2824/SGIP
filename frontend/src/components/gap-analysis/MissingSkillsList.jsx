import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export function MissingSkillsList({ title, items = [], required = false }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <Badge tone={required ? 'danger' : 'warning'}>{items.length}</Badge>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.normalizedName} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-white">{item.skillName}</p>
              <Badge tone={required ? 'danger' : 'warning'}>Missing</Badge>
              {item.minimumLevel ? <Badge tone="neutral">{item.minimumLevel}</Badge> : null}
            </div>
            <p className="mt-2 text-sm text-slate-400">{item.reason}</p>
          </div>
        ))}
        {!items.length ? <p className="text-sm text-slate-400">No missing skills in this category.</p> : null}
      </div>
    </Card>
  );
}
