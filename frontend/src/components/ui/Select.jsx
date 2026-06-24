import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export const Select = forwardRef(({ label, error, className, helperText, id, children, ...props }, ref) => {
  const selectId = id || props.name;

  return (
    <label className="block space-y-2" htmlFor={selectId}>
      {label ? <span className="text-sm font-medium text-slate-200">{label}</span> : null}
      <select
        id={selectId}
        ref={ref}
        className={cn(
          'focus-ring w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-colors hover:border-white/20',
          error ? 'border-red-400/50' : 'border-white/10',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {helperText && !error ? <p className="text-xs text-slate-500">{helperText}</p> : null}
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </label>
  );
});

Select.displayName = 'Select';
