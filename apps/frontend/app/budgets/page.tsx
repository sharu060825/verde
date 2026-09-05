'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { PlusCircle, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export default function BudgetsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currency = user?.currency || 'INR';

  const loadBudgetsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        apiFetch<Budget[]>('/api/budgets'),
        apiFetch<Array<{ id: string; name: string }>>('/api/categories'),
      ]);

      setBudgets(budgetsRes);
      setCategories(categoriesRes);
      if (categoriesRes.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesRes[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadBudgetsData();
    }
  }, [authLoading, user, router, loadBudgetsData]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(limitAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid budget limit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category: selectedCategory,
          limit: amount,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        }),
      });

      setLimitAmount('');
      loadBudgetsData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save budget limit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Remove this category budget?')) return;
    try {
      await apiFetch(`/api/budgets/${id}`, { method: 'DELETE' });
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete budget.');
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-[#0a0d0b]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Navbar title="Spending Limits" />

        {/* Action & Create Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Form */}
          <div className="border border-[#e6ebe8] bg-white rounded-2xl p-6 text-xs space-y-4 shadow-xs">
            <div className="border-b border-[#e6ebe8] pb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">Allocation</span>
              <h3 className="text-sm font-bold text-[#0a0d0b]">Define Category Limit</h3>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-xs text-[#0a0d0b] outline-none focus:border-[#15803d]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Monthly Limit ({currency})</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 5000"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-xs text-[#0a0d0b] num-tabular outline-none focus:border-[#15803d]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#15803d] py-2.5 text-xs font-semibold text-white hover:bg-[#166534] transition disabled:opacity-50 shadow-xs"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Set Budget Cap'}</span>
              </button>
            </form>
          </div>

          {/* Active Limits Grid */}
          <div className="lg:col-span-2 border border-[#e6ebe8] bg-white rounded-2xl p-6 text-xs shadow-xs">
            <div className="flex items-center justify-between border-b border-[#e6ebe8] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">Overview</span>
                <h3 className="text-sm font-bold text-[#0a0d0b]">Active Limits & Utilization</h3>
              </div>
              <span className="text-[10px] text-[#4b554f]">Current Month</span>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-[#838e87]">Loading limits...</div>
            ) : budgets.length === 0 ? (
              <div className="py-8 text-center text-[#838e87]">
                No budget thresholds configured. Set a limit on the left.
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.map((b) => (
                  <div key={b.id} className="border border-[#e6ebe8] bg-[#f8faf9] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {b.isOverBudget ? (
                          <AlertCircle className="h-4 w-4 text-[#0a0d0b]" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-[#15803d]" />
                        )}
                        <span className="font-semibold text-[#0a0d0b]">{b.category}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[#0a0d0b] num-tabular font-semibold">
                          {formatCurrency(b.spent, currency)} / {formatCurrency(b.limit, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBudget(b.id)}
                          className="text-[#838e87] hover:text-[#0a0d0b]"
                          title="Remove budget"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-[#e6ebe8] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          b.isOverBudget
                            ? 'bg-[#0a0d0b]'
                            : 'bg-[#15803d]'
                        }`}
                        style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-[#4b554f]">
                      <span>{Math.round(b.percentUsed)}% consumed</span>
                      <span>
                        {b.isOverBudget
                          ? `Exceeded cap by ${formatCurrency(Math.abs(b.remaining), currency)}`
                          : `${formatCurrency(b.remaining, currency)} available`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
