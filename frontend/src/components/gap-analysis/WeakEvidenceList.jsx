import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export function WeakEvidenceList({ items = [] }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Weak evidence</h2>
        <Badge tone="warning">{items.length}</Badge>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.normalizedName} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">{item.skillName}</p>
            <p className="mt-1 text-sm font-medium text-amber-800">{item.issue}</p>
            <p className="mt-2 text-sm text-slate-400">{item.recommendation}</p>
          </div>
        ))}
        {!items.length ? <p className="text-sm text-slate-400">No weak evidence issues detected.</p> : null}
      </div>
    </Card>
  );
}
