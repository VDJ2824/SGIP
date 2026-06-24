import { cn } from '@/utils/cn';

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">{eyebrow}</p>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
          {description ? <p className="max-w-3xl text-sm leading-6 text-slate-300">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
