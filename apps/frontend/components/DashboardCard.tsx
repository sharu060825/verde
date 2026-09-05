import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Target,
} from 'lucide-react';

const icons = {
  wallet: Wallet,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'piggy-bank': PiggyBank,
  receipt: Receipt,
  target: Target,
};

export interface DashboardCardProps {
  title: string;
  value: string;
  icon: 'wallet' | 'trending-up' | 'trending-down' | 'piggy-bank' | 'receipt' | 'target';
  trend?: 'up' | 'down' | 'neutral';
  percentage?: string;
  subtitle?: string;
}

export function DashboardCard({
  title,
  value,
  icon,
  trend = 'neutral',
  percentage,
  subtitle,
}: DashboardCardProps) {
  const Icon = icons[icon] || Wallet;
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <Card className="border border-[#e6ebe8] bg-white rounded-2xl shadow-xs">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4b554f]">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#0a0d0b] num-tabular">{value}</p>
          </div>
          <div className="rounded-xl bg-[#f0fdf4] p-3 text-[#15803d]">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {isPositive && <ArrowUpRight className="h-4 w-4 text-[#15803d]" />}
          {isNegative && <ArrowDownRight className="h-4 w-4 text-[#0a0d0b]" />}
          {percentage && (
            <span
              className={
                isPositive ? 'font-semibold text-[#15803d]' : isNegative ? 'font-semibold text-[#0a0d0b]' : 'text-[#4b554f]'
              }
            >
              {percentage}
            </span>
          )}
          {subtitle && <span className="text-[#838e87]">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
