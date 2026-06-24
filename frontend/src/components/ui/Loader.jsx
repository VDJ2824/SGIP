import { cn } from '@/utils/cn';

export function Loader({ className, label = 'Loading' }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 text-sm text-slate-300', className)} aria-live="polite">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400/30 border-t-brand-300" />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-2xl bg-white/10', className)} />;
}
