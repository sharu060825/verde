'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface SummaryData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  currentMonth: {
    income: number;
    expense: number;
    balance: number;
    savingsRate: number;
    expenseChangePercent: number;
    incomeChangePercent: number;
  };
  topCategory: string;
  topCategoryAmount: number;
  transactionCount: number;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  monthlyTrends: Array<{ month: string; income: number; expense: number; net: number }>;
}

// Controlled Green x Black x Slate financial palette
const VERDE_CHART_COLORS = [
  '#0f5132',
  '#15803d',
  '#16a34a',
  '#22c55e',
  '#4ade80',
  '#0a0d0b',
  '#374151',
  '#6b7280',
];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = user?.currency || 'INR';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<SummaryData>('/api/transactions/summary');
      setSummary(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadData();
    }
  }, [authLoading, user, router, loadData]);

  return (
    <div className="flex min-h-screen bg-white text-[#0a0d0b]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Navbar title="Financial Diagnostics" />

        {/* Diagnostic KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-[#e6ebe8] bg-white rounded-2xl p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">Savings Ratio</span>
            <p className="mt-2 text-3xl font-extrabold text-[#0a0d0b] num-tabular">
              {summary?.savingsRate ?? 0}%
            </p>
            <p className="text-[10px] text-[#4b554f] mt-1">Net savings efficiency</p>
          </div>

          <div className="border border-[#e6ebe8] bg-white rounded-2xl p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">Peak Category</span>
            <p className="mt-2 text-xl font-bold text-[#0a0d0b] truncate">
              {summary?.topCategory || 'N/A'}
            </p>
            <p className="text-[10px] text-[#4b554f] mt-1 num-tabular">
              {formatCurrency(summary?.topCategoryAmount ?? 0, currency)}
            </p>
          </div>

          <div className="border border-[#e6ebe8] bg-white rounded-2xl p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">Monthly Outflow</span>
            <p className="mt-2 text-2xl font-bold text-[#0a0d0b] num-tabular">
              {formatCurrency(summary?.currentMonth.expense ?? 0, currency)}
            </p>
            <p className="text-[10px] text-[#4b554f] mt-1">Current month expenses</p>
          </div>

          <div className="border border-[#e6ebe8] bg-white rounded-2xl p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">Sample Depth</span>
            <p className="mt-2 text-2xl font-bold text-[#0a0d0b] num-tabular">
              {summary?.transactionCount ?? 0}
            </p>
            <p className="text-[10px] text-[#4b554f] mt-1">Audit transactions logged</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown Donut */}
          <div className="border border-[#e6ebe8] bg-white rounded-2xl p-6 text-xs shadow-xs">
            <div className="border-b border-[#e6ebe8] pb-3 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">Distribution</span>
              <h3 className="text-sm font-bold text-[#0a0d0b]">Category Allocation Matrix</h3>
            </div>

            <div className="h-64 w-full">
              {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {summary.categoryBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={VERDE_CHART_COLORS[index % VERDE_CHART_COLORS.length]}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e6ebe8',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#0a0d0b',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-[#838e87]">
                  No categorical expense data recorded.
                </div>
              )}
            </div>

            {/* Category Percent Table */}
            {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#e6ebe8] pt-3">
                {summary.categoryBreakdown.slice(0, 6).map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: VERDE_CHART_COLORS[i % VERDE_CHART_COLORS.length] }}
                      />
                      <span className="text-[#4b554f] truncate">{c.category}</span>
                    </div>
                    <span className="font-semibold text-[#0a0d0b] num-tabular">
                      {c.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Comparison Bar Chart */}
          <div className="border border-[#e6ebe8] bg-white rounded-2xl p-6 text-xs shadow-xs">
            <div className="flex items-center justify-between border-b border-[#e6ebe8] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">Comparison</span>
                <h3 className="text-sm font-bold text-[#0a0d0b]">Multi-Period Cash Flow</h3>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-[#15803d] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#15803d]" /> Inflow
                </span>
                <span className="flex items-center gap-1 text-[#0a0d0b] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#0a0d0b]" /> Outflow
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {summary?.monthlyTrends && summary.monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f3" />
                    <XAxis dataKey="month" stroke="#838e87" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#838e87" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e6ebe8',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#0a0d0b',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Bar dataKey="income" name="Inflow" fill="#15803d" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Outflow" fill="#0a0d0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-[#838e87]">
                  No multi-month records yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
