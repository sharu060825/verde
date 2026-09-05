import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-emerald-600 text-white',
    secondary: 'border-transparent bg-emerald-50 text-emerald-700',
    outline: 'border-slate-200 text-slate-700',
  };

  return <div className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', variants[variant], className)} {...props} />;
}

export { Badge };
