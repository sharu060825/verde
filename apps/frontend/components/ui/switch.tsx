import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(({ className, checked = false, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition', checked ? 'bg-emerald-600' : 'bg-slate-200', className)}
      {...props}
    >
      <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white transition', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
});
Switch.displayName = 'Switch';

export { Switch };
