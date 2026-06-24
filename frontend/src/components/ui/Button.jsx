import { forwardRef } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

const variants = {
  primary:
    'bg-brand-500 text-[#fff] hover:bg-brand-600 shadow-glow border border-brand-300/20',
  secondary:
    'bg-white/10 text-white border border-white/10 hover:bg-white/15',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/5',
  danger: 'bg-red-500/90 text-[#fff] hover:bg-red-500 border border-red-300/20',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export const Button = forwardRef(
  (
    {
      as: Component = 'button',
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon: Icon,
      children,
      type = 'button',
      disabled,
      ...props
    },
    ref,
  ) => {
    const isButton = Component === 'button';

    return (
      <Component
        ref={ref}
        type={isButton ? type : undefined}
        className={cn(
          'focus-ring inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={isButton ? isLoading || disabled : undefined}
        aria-disabled={!isButton && (isLoading || disabled) ? true : undefined}
        {...props}
      >
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : Icon ? (
          <Icon className="h-4 w-4" aria-hidden="true" />
        ) : null}
        <span>{children}</span>
      </Component>
    );
  },
);

Button.displayName = 'Button';
