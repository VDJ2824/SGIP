import { FileX2 } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon = FileX2 }) {
  return (
    <Card className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p> : null}
      {actionLabel && onAction ? (
        <div className="mt-6">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
