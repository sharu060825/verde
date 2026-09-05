'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PlusCircle, Target, ArrowRight, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { VerdeIcon } from '@/components/VerdeIcon';

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
  recentTransactions: Array<{
    id: string;
    title: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    date: string;
    paymentMethod: string;
  }>;
}

interface BudgetRecord {
  id: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = user?.currency || 'INR';

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [summaryRes, budgetsRes] = await Promise.all([
        apiFetch<SummaryData>('/api/transactions/summary'),
        apiFetch<BudgetRecord[]>('/api/budgets'),
      ]);

      setSummary(summaryRes);
      setBudgets(budgetsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load ledger data.');
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
      loadDashboardData();
    }
  }, [authLoading, user, router, loadDashboardData]);

  if (authLoading || (!user && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#4b554f]">
        <div className="flex flex-col items-center gap-3">
          <VerdeIcon size="md" isThinking />
          <p className="text-xs uppercase tracking-wider text-[#838e87]">Loading Financial Ledger...</p>
        </div>
      </div>
    );
  }

  const netBalance = summary?.totalBalance ?? 0;
  const monthIncome = summary?.currentMonth.income ?? 0;
  const monthExpense = summary?.currentMonth.expense ?? 0;
  const savingsRate = summary?.currentMonth.savingsRate ?? 0;
  const topCat = summary?.topCategory ?? 'None';
  const topCatAmount = summary?.topCategoryAmount ?? 0;

  return (
    <div className="flex min-h-screen bg-white text-[#0a0d0b]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Navbar title="Financial Ledger" />

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#e6ebe8] bg-[#f8faf9] p-4 text-xs text-[#0a0d0b] font-medium">
            <span>{error}</span>
            <button
              onClick={loadDashboardData}
              className="font-semibold underline text-[#15803d]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Section: PRIMARY CAPITAL (Editorial Large Typography) */}
        <section className="border border-[#e6ebe8] bg-white rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e6ebe8] pb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">
                01 / Primary Capital
              </span>
              <p className="mt-1 text-xs text-[#4b554f]">Total Net Balance</p>
              <h2 className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-[#0a0d0b] num-tabular">
                {formatCurrency(netBalance, currency)}
              </h2>
            </div>

            {/* Inflow vs Outflow Blocks */}
            <div className="flex flex-wrap gap-4">
              <div className="border border-[#e6ebe8] bg-[#f8faf9] rounded-xl p-3.5 min-w-[160px]">
                <div className="flex items-center justify-between text-xs text-[#4b554f]">
                  <span>Monthly Inflow</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#15803d]" />
                </div>
                <p className="mt-1 text-lg font-bold text-[#15803d] num-tabular">
                  {formatCurrency(monthIncome, currency)}
                </p>
                <p className="text-[10px] text-[#15803d] mt-0.5">Recorded earnings</p>
              </div>

              <div className="border border-[#e6ebe8] bg-[#f8faf9] rounded-xl p-3.5 min-w-[160px]">
                <div className="flex items-center justify-between text-xs text-[#4b554f]">
                  <span>Monthly Outflow</span>
                  <ArrowDownRight className="h-3.5 w-3.5 text-[#0a0d0b]" />
                </div>
                <p className="mt-1 text-lg font-bold text-[#0a0d0b] num-tabular">
                  {formatCurrency(monthExpense, currency)}
                </p>
                <p className="text-[10px] text-[#4b554f] mt-0.5">
                  Savings Rate: <span className="font-semibold text-[#15803d]">{savingsRate}%</span>
                </p>
              </div>

              <div className="border border-[#e6ebe8] bg-[#f8faf9] rounded-xl p-3.5 min-w-[160px]">
                <div className="flex items-center justify-between text-xs text-[#4b554f]">
                  <span>Top Outlay</span>
                  <span className="text-[10px] uppercase text-[#0a0d0b] font-bold">Category</span>
                </div>
                <p className="mt-1 text-sm font-bold text-[#0a0d0b] truncate max-w-[140px]">{topCat}</p>
                <p className="text-[10px] text-[#4b554f] mt-0.5 num-tabular">
                  {formatCurrency(topCatAmount, currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[#4b554f]">
              Audit: <span className="text-[#0a0d0b] font-semibold">{summary?.transactionCount ?? 0} transactions</span> recorded across accounts.
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/add-expense"
                className="flex items-center gap-1.5 rounded-lg bg-[#15803d] px-3.5 py-1.5 font-semibold text-white transition hover:bg-[#166534] shadow-2xs"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Record Transaction</span>
              </Link>
              <Link
                href="/budgets"
                className="flex items-center gap-1.5 rounded-lg border border-[#d1d8d3] bg-white px-3.5 py-1.5 font-semibold text-[#0a0d0b] transition hover:bg-[#f8faf9]"
              >
                <Target className="h-3.5 w-3.5 text-[#15803d]" />
                <span>Configure Limits</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Section: CASH FLOW TIMELINE & BUDGET PRESSURE */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-[#e6ebe8] bg-white rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#e6ebe8] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">
                  02 / Flow Timeline
                </span>
                <h3 className="text-sm font-bold text-[#0a0d0b]">Monthly Cash Flow Comparison</h3>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-[#15803d] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#15803d]" /> Income
                </span>
                <span className="flex items-center gap-1 text-[#0a0d0b] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#0a0d0b]" /> Expense
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {summary?.monthlyTrends && summary.monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.monthlyTrends}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0a0d0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0a0d0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    <Area type="monotone" dataKey="income" name="Income" stroke="#15803d" strokeWidth={2} fill="url(#incomeGrad)" />
                    <Area type="monotone" dataKey="expense" name="Expense" stroke="#0a0d0b" strokeWidth={2} fill="url(#expenseGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#838e87]">
                  No monthly trends recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Section: BUDGET BOUNDARIES (Compact Limits Monitor) */}
          <div className="border border-[#e6ebe8] bg-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#e6ebe8] pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">
                    03 / Budget Boundaries
                  </span>
                  <h3 className="text-sm font-bold text-[#0a0d0b]">Active Category Limits</h3>
                </div>
                <Link href="/budgets" className="text-[11px] font-semibold text-[#15803d] hover:underline">
                  Manage
                </Link>
              </div>

              {budgets.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#4b554f]">
                  <p>No category budgets defined yet.</p>
                  <Link
                    href="/budgets"
                    className="mt-2 inline-block text-[11px] font-semibold text-[#15803d] underline"
                  >
                    Set a monthly limit
                  </Link>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {budgets.slice(0, 4).map((b) => (
                    <div key={b.id} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-[#0a0d0b]">{b.category}</span>
                        <span className="text-[#4b554f] num-tabular">
                          {formatCurrency(b.spent, currency)} / {formatCurrency(b.limit, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#f1f5f3] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            b.isOverBudget
                              ? 'bg-[#0a0d0b]'
                              : 'bg-[#15803d]'
                          }`}
                          style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financial Observation Callout */}
            <div className="mt-6 border-t border-[#e6ebe8] pt-4 text-xs">
              <div className="flex items-center gap-1.5 text-[#15803d] font-bold text-[11px]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Discipline Metric</span>
              </div>
              <p className="mt-1 text-[11px] text-[#4b554f] leading-relaxed">
                {savingsRate >= 20
                  ? `Savings discipline is solid at ${savingsRate}%. Maintaining this pace strengthens your cash reserves.`
                  : `Current savings rate is ${savingsRate}%. Reviewing outlays in ${topCat} can improve your reserve margins.`}
              </p>
            </div>
          </div>
        </section>

        {/* Section: RECENT ACTIVITY (Transaction Ledger Stream) */}
        <section className="border border-[#e6ebe8] bg-white rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e6ebe8] pb-3 mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">
                04 / Journal Stream
              </span>
              <h3 className="text-sm font-bold text-[#0a0d0b]">Recent Transactions</h3>
            </div>
            <Link href="/expenses" className="text-xs font-semibold text-[#15803d] hover:underline flex items-center gap-1">
              <span>Full Journal</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
            <div className="divide-y divide-[#e6ebe8]">
              {summary.recentTransactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        tx.type === 'INCOME' ? 'bg-[#15803d]' : 'bg-[#0a0d0b]'
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-[#0a0d0b]">{tx.title}</p>
                      <p className="text-[10px] text-[#838e87]">
                        {tx.category} • {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold num-tabular ${
                        tx.type === 'INCOME' ? 'text-[#15803d]' : 'text-[#0a0d0b]'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                    </span>
                    <p className="text-[10px] text-[#838e87]">{tx.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#838e87]">
              No transactions recorded in journal yet.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
