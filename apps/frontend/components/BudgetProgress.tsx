import { formatCurrency } from '@/lib/currency';
import { AlertCircle } from 'lucide-react';

export interface BudgetProgressProps {
  category: string;
  spent: number;
  total: number;
  currency?: string;
  isOverBudget?: boolean;
}

export function BudgetProgress({
  category,
  spent,
  total,
  currency = 'INR',
  isOverBudget = false,
}: BudgetProgressProps) {
  const percent = total > 0 ? Math.round((spent / total) * 100) : 0;
  const clampedPercent = Math.min(percent, 100);

  const getBarColor = () => {
    if (isOverBudget || percent >= 100) return 'bg-[#0a0d0b]';
    return 'bg-[#15803d]';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-[#0a0d0b]">{category}</span>
        <span className="font-medium text-[#4b554f] num-tabular">
          {formatCurrency(spent, currency)} / {formatCurrency(total, currency)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#e6ebe8]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[#838e87]">
        <span className={percent >= 100 ? 'font-semibold text-[#0a0d0b]' : ''}>
          {percent}% used
        </span>
        {isOverBudget ? (
          <span className="flex items-center gap-1 font-semibold text-[#0a0d0b]">
            <AlertCircle className="h-3.5 w-3.5" />
            Over budget by {formatCurrency(spent - total, currency)}
          </span>
        ) : (
          <span>{formatCurrency(Math.max(0, total - spent), currency)} remaining</span>
        )}
      </div>
    </div>
  );
}
