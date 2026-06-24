import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

export function StatCard({ label, value, helper, icon: Icon, trend, className }) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/70 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-slate-400">{label}</p>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
            {trend ? <span className="text-xs font-medium text-brand-300">{trend}</span> : null}
          </div>
          {helper ? <p className="text-sm text-slate-400">{helper}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
