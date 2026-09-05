import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export interface TransactionItemProps {
  id: string | number;
  title: string;
  amount: number;
  date: string;
  category: string;
  type: 'INCOME' | 'EXPENSE' | string;
  paymentMethod?: string;
  currency?: string;
}

export function TransactionItem({
  title,
  amount,
  date,
  category,
  type,
  paymentMethod,
  currency = 'INR',
}: TransactionItemProps) {
  const isIncome = type === 'INCOME';
  const formattedAmount = `${isIncome ? '+' : '-'}${formatCurrency(amount, currency)}`;

  const formattedDate = (() => {
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return date;
    } catch {
      return date;
    }
  })();

  return (
    <Card className="border border-[#e6ebe8] bg-white transition-all hover:bg-[#f8faf9] rounded-2xl">
      <CardContent className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isIncome ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-[#f8faf9] text-[#0a0d0b]'
            }`}
          >
            {isIncome ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-semibold text-[#0a0d0b]">{title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#838e87]">
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="font-medium text-[#4b554f]">{category}</span>
              {paymentMethod && (
                <>
                  <span>•</span>
                  <span>{paymentMethod}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className={`font-bold num-tabular ${isIncome ? 'text-[#15803d]' : 'text-[#0a0d0b]'}`}>
            {formattedAmount}
          </p>
          <Badge
            variant={isIncome ? 'secondary' : 'outline'}
            className={`mt-1 text-[10px] ${
              isIncome ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]' : 'border-[#d1d8d3] text-[#4b554f]'
            }`}
          >
            {type}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
