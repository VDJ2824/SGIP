import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
export const Input = forwardRef(
  ({ label, error, className, helperText, id, leftIcon: LeftIcon, rightIcon: RightIcon, inputClassName, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <label className="block space-y-2" htmlFor={inputId}>
        {label ? <span className="text-sm font-medium text-slate-200">{label}</span> : null}
        <div className="relative">
          {LeftIcon ? (
            <LeftIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          ) : null}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'focus-ring w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white placeholder:text-slate-500 transition-colors hover:border-white/20',
              LeftIcon ? 'pl-11' : 'px-4',
              RightIcon ? 'pr-11' : null,
              error ? 'border-red-400/50' : 'border-white/10',
              className,
              inputClassName,
            )}
            {...props}
          />
          {RightIcon ? (
            <RightIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          ) : null}
        </div>
        {helperText && !error ? <p className="text-xs text-slate-500">{helperText}</p> : null}
        {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
      </label>
    );
  },
);

Input.displayName = 'Input';
