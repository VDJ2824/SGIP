import { cn } from '@/utils/cn';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('glass-panel rounded-3xl p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
}
