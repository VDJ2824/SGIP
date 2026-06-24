import { cn } from '@/utils/cn';

export function ErrorMessage({ title = 'Something went wrong', message, icon: Icon, className }) {
  return (
    <div className={cn('rounded-3xl border border-red-300 bg-red-50 p-4 text-red-900', className)} role="alert">
      <div className="flex items-start gap-3">
        {Icon ? <Icon className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" /> : null}
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          {message ? <p className="text-sm leading-6 text-red-800">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
