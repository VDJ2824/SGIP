import { cn } from '@/utils/cn';

const tones = {
  success: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  info: 'bg-sky-100 text-sky-800 border-sky-300',
  warning: 'bg-amber-100 text-amber-800 border-amber-300',
  danger: 'bg-rose-100 text-rose-800 border-rose-300',
  neutral: 'bg-white/10 text-slate-300 border-white/10',
};

export function Badge({ children, tone = 'neutral', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
