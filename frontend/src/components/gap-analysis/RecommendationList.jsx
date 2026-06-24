import { BadgeCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function RecommendationList({ items = [] }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-white">Recommendations</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-200" />
            <p className="text-sm leading-6 text-slate-300">{item}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
